import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  playerData: any | null;
  login: (email: string, pass: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  createPlayerAccount: (email: string, password: string, playerName: string, team: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  playerData: null,
  login: async () => {},
  logout: async () => {},
  createPlayerAccount: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [playerData, setPlayerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayerData = async (user: User) => {
    try {
      // Check if there's a players doc linked to this auth UID
      const playerDocRef = doc(db, 'playerAuth', user.uid);
      const playerSnap = await getDoc(playerDocRef);
      if (playerSnap.exists()) {
        const linkedPlayerId = playerSnap.data().playerId;
        const actualPlayerRef = doc(db, 'players', linkedPlayerId);
        const actualPlayerSnap = await getDoc(actualPlayerRef);
        if (actualPlayerSnap.exists()) {
          setPlayerData({ id: actualPlayerSnap.id, ...actualPlayerSnap.data() });
        }
      }
    } catch (e) {
      console.error("Failed to fetch player data:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchPlayerData(user);
      } else {
        setPlayerData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string, rememberMe: boolean) => {
    // DEV ONLY MOCK
    if (import.meta.env.VITE_FIREBASE_API_KEY === undefined || import.meta.env.VITE_FIREBASE_API_KEY === '') {
      console.warn("Using Dev Mock Login");
      if (email === 'admin@shc.com' && pass === 'Saran190721') {
        setCurrentUser({ email: 'admin@shc.com' } as User);
        return;
      } else {
        throw new Error("Invalid mock credentials");
      }
    }

    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const createPlayerAccount = async (email: string, password: string, playerName: string, team: string) => {
    // Admin creates a Firebase Auth account + links it to a player doc
    // We use secondary auth app approach to avoid logging out admin
    // For simplicity: use fetch to Firebase REST API to create user
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    const newAuthUid = data.localId;

    // Create the player document in the 'players' collection
    const playersRef = collection(db, 'players');
    const newPlayerRef = doc(playersRef);
    const newPlayer = {
      id: newPlayerRef.id,
      name: playerName,
      team: team || '',
      profileImage: `https://i.pravatar.cc/150?u=${newPlayerRef.id}`,
      metrics: { wins: 0, top3: 0, average: 0, totalPoints: 0, form: [] }
    };
    await setDoc(newPlayerRef, newPlayer);

    // Link the auth UID to the player ID
    const playerAuthRef = doc(db, 'playerAuth', newAuthUid);
    await setDoc(playerAuthRef, {
      playerId: newPlayerRef.id,
      email: email
    });

    return;
  };

  const logout = () => {
    setPlayerData(null);
    return signOut(auth);
  };

  const isAdmin = currentUser?.email === 'admin@shc.com';

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, playerData, login, logout, createPlayerAccount }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
