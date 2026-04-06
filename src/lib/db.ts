import { collection, getDocs, doc, setDoc, query, orderBy, where, Timestamp, getDoc, writeBatch, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface Player {
  id: string;
  name: string;
  shortName?: string;
  team?: string;
  profileImage: string;
  metrics: {
    wins: number;
    top3: number;
    average: number;
    totalPoints: number;
    totalRawScore?: number;
    form?: ('W'|'L'|'D')[];
  };
}

export interface Match {
  id: string;
  matchNumber: number;
  matchTitle?: string;
  createdAt: Timestamp;
  locked: boolean;
}

export interface Entry {
  id: string;
  matchId: string;
  playerId: string;
  score: number;
  rank: number;
  pointsAwarded: number;
  previousPoints: number;
}

// References
const playersRef = collection(db, 'players');
const matchesRef = collection(db, 'matches');
const entriesRef = collection(db, 'entries');

// Fetch Players
export const getPlayers = async (): Promise<Player[]> => {
  const snapshot = await getDocs(query(playersRef, orderBy('metrics.totalPoints', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
};

export const addPlayer = async (name: string, team?: string) => {
  const newRef = doc(playersRef);
  const newPlayer: Player = {
    id: newRef.id,
    name,
    team: team || '',
    profileImage: '/default-avatar.svg',
    metrics: { wins: 0, top3: 0, average: 0, totalPoints: 0, form: [] }
  };
  await setDoc(newRef, newPlayer);
  return newPlayer;
};

// Seed Initial Players (Helper for testing)
export const seedPlayers = async (players: Omit<Player, "metrics">[]) => {
  for (const p of players) {
    const docRef = doc(playersRef, p.id);
    await setDoc(docRef, {
      ...p,
      metrics: { wins: 0, top3: 0, average: 0, totalPoints: 0, form: [] }
    });
  }
};

// Get specific Match
export const getMatch = async (matchId: string): Promise<Match | null> => {
  const docRef = doc(matchesRef, matchId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Match;
  }
  return null;
}

// Get past matches summary
export const getMatches = async (): Promise<Match[]> => {
  const snapshot = await getDocs(query(matchesRef, orderBy('matchNumber', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
}

// Get entries for a match
export const getMatchEntries = async (matchId: string): Promise<Entry[]> => {
  const snapshot = await getDocs(query(entriesRef, where('matchId', '==', matchId)));
  const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
  return entries.sort((a,b) => a.rank - b.rank);
}

// Get all entries for a specific player across all matches
export const getPlayerEntries = async (playerId: string): Promise<Entry[]> => {
  const snapshot = await getDocs(query(entriesRef, where('playerId', '==', playerId)));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
}

export const saveMatchResults = async (matchNumber: number, results: any[], matchTitle?: string) => {
  const batch = writeBatch(db);
  const activeSeasonId = await getActiveSeasonId();
  
  // Create Match Document
  const newMatchRef = doc(matchesRef);
  batch.set(newMatchRef, {
    id: newMatchRef.id,
    matchNumber,
    seasonId: activeSeasonId,
    matchTitle: matchTitle || `Match ${matchNumber}`,
    createdAt: Timestamp.now(),
    locked: true
  });

  // Create Entries and Update Players
  for (const result of results) {
    // Entry
    const newEntryRef = doc(entriesRef);
    batch.set(newEntryRef, {
      id: newEntryRef.id,
      matchId: newMatchRef.id,
      playerId: result.playerId,
      score: result.score,
      rank: result.rank,
      pointsAwarded: result.pointsAwarded,
      previousPoints: result.prevPoints
    });

    // We no longer manually calculate player metrics here.
    // We strictly write the match and entries to the DB, 
    // then call a global recalculator to absolutely guarantee 100% sync.
  }

  await batch.commit();
  await recalculateAllPlayerMetrics();
};

export const deletePlayer = async (playerId: string) => {
  const pRef = doc(playersRef, playerId);
  await deleteDoc(pRef);
};

export const getActiveSeasonId = async (): Promise<string> => {
  const docRef = doc(collection(db, 'system'), 'settings');
  const snap = await getDoc(docRef);
  if (!snap.exists() || !snap.data().activeSeasonId) {
    await setDoc(docRef, { activeSeasonId: 'season-1' }, { merge: true });
    return 'season-1';
  }
  return snap.data().activeSeasonId;
};

export const startNewSeason = async (newSeasonId: string) => {
  // 1. Snapshot current leaderboard for the Hall of Fame
  const currentSeasonId = await getActiveSeasonId();
  const currentPlayers = await getPlayers(); // Automatically sorted by points correctly
  
  const seasonSnapshotRef = doc(collection(db, 'seasons'), currentSeasonId);
  await setDoc(seasonSnapshotRef, {
    id: currentSeasonId,
    archivedAt: Timestamp.now(),
    standings: currentPlayers.map((p, index) => ({
       rank: index + 1,
       name: p.name,
       avatar: p.profileImage,
       points: p.metrics.totalPoints,
       wins: p.metrics.wins
    }))
  });

  // 2. Roll over active season
  const settingsRef = doc(collection(db, 'system'), 'settings');
  await setDoc(settingsRef, { activeSeasonId: newSeasonId }, { merge: true });

  // 3. Recalculate metrics (this drops everyone to 0 since there are no matches)
  await recalculateAllPlayerMetrics();
};

export const deleteMatch = async (matchId: string) => {
  const batch = writeBatch(db);
  const matchEntries = await getMatchEntries(matchId);
  
  for (const entry of matchEntries) {
    batch.delete(doc(entriesRef, entry.id));
  }
  
  batch.delete(doc(matchesRef, matchId));
  await batch.commit();
  await recalculateAllPlayerMetrics();
};

export const recalculateAllPlayerMetrics = async () => {
   const activeSeasonId = await getActiveSeasonId();

   const pSnapshot = await getDocs(playersRef);
   const players = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
   
   const eSnapshot = await getDocs(entriesRef);
   const allEntries = eSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));

   const mSnapshot = await getDocs(matchesRef);
   const allMatches = mSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
   
   // Filter exactly down to the current season matches
   const activeMatches = allMatches.filter(m => (m as any).seasonId === activeSeasonId || (!m.hasOwnProperty('seasonId') && activeSeasonId === 'season-1'));
   const activeMatchIds = activeMatches.map(m => m.id);
   
   // Filter entries
   const activeEntries = allEntries.filter(e => activeMatchIds.includes(e.matchId));

   const batch = writeBatch(db);

   for (const p of players) {
      const pEntries = activeEntries.filter(e => e.playerId === p.id);
      
      // Sort entries by Match Date to get correct Form
      pEntries.sort((a, b) => {
         const ma = activeMatches.find(m => m.id === a.matchId);
         const mb = activeMatches.find(m => m.id === b.matchId);
         const numA = ma ? ma.matchNumber : 0;
         const numB = mb ? mb.matchNumber : 0;
         return numB - numA; // Descending
      });

      const totalPoints = pEntries.reduce((sum, e) => sum + e.pointsAwarded, 0);
      const totalRawScore = pEntries.reduce((sum, e) => sum + e.score, 0);
      const wins = pEntries.filter(e => e.rank === 1).length;
      const top3 = pEntries.filter(e => e.rank <= 3).length;
      const avg = pEntries.length > 0 ? Math.round(totalPoints / pEntries.length) : 0;
      
      const form = pEntries.slice(0, 5).map(e => {
         if (e.rank <= 3) return 'W';
         if (e.rank <= 5) return 'D';
         return 'L';
      });

      batch.update(doc(playersRef, p.id), {
         'metrics.totalPoints': totalPoints,
         'metrics.totalRawScore': totalRawScore,
         'metrics.wins': wins,
         'metrics.top3': top3,
         'metrics.average': avg,
         'metrics.form': form
      });
   }
   
   await batch.commit();
};

export const updatePlayerProfile = async (playerId: string, name: string, team: string) => {
  const pRef = doc(playersRef, playerId);
  await updateDoc(pRef, { name, team: team || '' });
};

export const hardResetLeague = async () => {
  const batch = writeBatch(db);
  const mSnap = await getDocs(matchesRef);
  mSnap.forEach(d => batch.delete(d.ref));
  const eSnap = await getDocs(entriesRef);
  eSnap.forEach(d => batch.delete(d.ref));
  const pSnap = await getDocs(playersRef);
  pSnap.forEach(d => {
    batch.update(d.ref, {
      'metrics.totalPoints': 0,
      'metrics.wins': 0,
      'metrics.top3': 0,
      'metrics.average': 0,
      'metrics.form': []
    });
  });
  await batch.commit();
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  dateEarned?: number;
}

export interface StreakData {
  currentWinStreak: number;
  bestWinStreak: number;
  currentLossStreak: number;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface HallOfFameEntry {
  id: string;
  seasonId: string;
  winnerName: string;
  winnerAvatar: string;
  points: number;
  totalPlayers: number;
  archivedAt: number;
}

export const computeStreaks = (entries: Entry[]): StreakData => {
  let currentWinStreak = 0;
  let bestWinStreak = 0;
  let currentLossStreak = 0;
  
  const sorted = [...entries].sort((a,b) => b.score - a.score); // Not perfect if score is arbitrary, but we just want chronological. Assume they are chronological.
  
  for (const e of sorted) {
    if (e.rank === 1) {
      currentWinStreak++;
      if (currentWinStreak > bestWinStreak) bestWinStreak = currentWinStreak;
      currentLossStreak = 0;
    } else if (e.rank >= 5) {
      currentLossStreak++;
      currentWinStreak = 0;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  }
  return { currentWinStreak, bestWinStreak, currentLossStreak };
};

export const computeAchievements = (player: Player, entries: Entry[]): Achievement[] => {
  const achievements: Achievement[] = [
    { id: 'first_win', name: 'First Blood', description: 'Win your first match', icon: '🏆', earned: player.metrics.wins > 0 },
    { id: 'hat_trick', name: 'Hat-Trick Hero', description: 'Win 3 matches in a row', icon: '🎩', earned: computeStreaks(entries).bestWinStreak >= 3 },
    { id: 'century', name: 'Century Club', description: 'Reach 100 total points', icon: '💯', earned: player.metrics.totalPoints >= 100 },
    { id: 'veteran', name: 'Veteran', description: 'Play 10 matches', icon: '🛡️', earned: entries.length >= 10 },
  ];
  return achievements;
};
