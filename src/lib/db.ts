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

export const saveMatchResults = async (matchNumber: number, results: any[], allPlayers: Player[], matchTitle?: string) => {
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

    // Player metrics
    const playerToUpdate = allPlayers.find(p => p.id === result.playerId);
    if (playerToUpdate) {
      const pRef = doc(playersRef, playerToUpdate.id);
      
      let formResult: 'W'|'L'|'D' = 'L';
      if (result.rank <= 3) formResult = 'W';
      else if (result.rank <= 5) formResult = 'D';

      const currentForm = playerToUpdate.metrics.form || [];
      const newForm = [formResult, ...currentForm].slice(0, 5);

      batch.update(pRef, {
        'metrics.totalPoints': playerToUpdate.metrics.totalPoints + result.pointsAwarded,
        'metrics.wins': playerToUpdate.metrics.wins + (result.rank === 1 ? 1 : 0),
        'metrics.top3': playerToUpdate.metrics.top3 + (result.rank <= 3 ? 1 : 0),
        'metrics.form': newForm
      });
    }
  }

  await batch.commit();
};

export const deletePlayer = async (playerId: string) => {
  const pRef = doc(playersRef, playerId);
  await deleteDoc(pRef);
};

export const deleteMatch = async (matchId: string) => {
  const batch = writeBatch(db);
  const matchEntries = await getMatchEntries(matchId);
  
  // Deduct points from players
  for (const entry of matchEntries) {
    const pRef = doc(playersRef, entry.playerId);
    const pSnap = await getDoc(pRef);
    if (pSnap.exists()) {
      const pData = pSnap.data() as Player;
      batch.update(pRef, {
        'metrics.totalPoints': Math.max(0, pData.metrics.totalPoints - entry.pointsAwarded),
        'metrics.wins': Math.max(0, pData.metrics.wins - (entry.rank === 1 ? 1 : 0)),
        'metrics.top3': Math.max(0, pData.metrics.top3 - (entry.rank <= 3 ? 1 : 0)),
      });
    }
    batch.delete(doc(entriesRef, entry.id)); // Delete entry
  }
  
  batch.delete(doc(matchesRef, matchId)); // Delete match
  await batch.commit();
};

export const updatePlayerProfile = async (playerId: string, name: string, team: string) => {
  const pRef = doc(playersRef, playerId);
  await updateDoc(pRef, { name, team: team || '' });
};

