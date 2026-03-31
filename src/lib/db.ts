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
    profileImage: `https://i.pravatar.cc/150?u=${newRef.id}`,
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
  
  // Create Match Document
  const newMatchRef = doc(matchesRef);
  batch.set(newMatchRef, {
    id: newMatchRef.id,
    matchNumber,
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

export const deleteMatch = async (matchId: string) => {
  const batch = writeBatch(db);
  const matchEntries = await getMatchEntries(matchId);
  
  // Delete entries without touching players manually
  for (const entry of matchEntries) {
    batch.delete(doc(entriesRef, entry.id));
  }
  
  batch.delete(doc(matchesRef, matchId)); // Delete match
  await batch.commit();
  
  // Recalculate precisely after everything is deleted
  await recalculateAllPlayerMetrics();
};

export const recalculateAllPlayerMetrics = async () => {
   const pSnapshot = await getDocs(playersRef);
   const players = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
   
   const eSnapshot = await getDocs(entriesRef);
   const allEntries = eSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));

   const mSnapshot = await getDocs(matchesRef);
   const allMatches = mSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
   
   const batch = writeBatch(db);

   for (const p of players) {
      const pEntries = allEntries.filter(e => e.playerId === p.id);
      
      // Sort entries by Match Date to get correct Form
      pEntries.sort((a, b) => {
         const ma = allMatches.find(m => m.id === a.matchId);
         const mb = allMatches.find(m => m.id === b.matchId);
         const numA = ma ? ma.matchNumber : 0;
         const numB = mb ? mb.matchNumber : 0;
         return numB - numA; // Descending
      });

      const totalPoints = pEntries.reduce((sum, e) => sum + e.pointsAwarded, 0);
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

