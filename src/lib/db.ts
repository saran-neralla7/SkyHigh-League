import { collection, getDocs, doc, setDoc, query, orderBy, where, Timestamp, getDoc, writeBatch } from 'firebase/firestore';
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
  };
}

export interface Match {
  id: string;
  matchNumber: number;
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
  previousPoints: number; // for tie-breaker reference
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
    metrics: { wins: 0, top3: 0, average: 0, totalPoints: 0 }
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
      metrics: { wins: 0, top3: 0, average: 0, totalPoints: 0 }
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
  const snapshot = await getDocs(query(entriesRef, where('matchId', '==', matchId), orderBy('rank', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
}

export const saveMatchResults = async (matchNumber: number, results: any[], allPlayers: Player[]) => {
  const batch = writeBatch(db);
  
  // Create Match Document
  const newMatchRef = doc(matchesRef);
  batch.set(newMatchRef, {
    id: newMatchRef.id,
    matchNumber,
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
      batch.update(pRef, {
        'metrics.totalPoints': playerToUpdate.metrics.totalPoints + result.pointsAwarded,
        'metrics.wins': playerToUpdate.metrics.wins + (result.rank === 1 ? 1 : 0),
        'metrics.top3': playerToUpdate.metrics.top3 + (result.rank <= 3 ? 1 : 0)
      });
    }
  }

  await batch.commit();
};
