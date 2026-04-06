import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
      const playerDocRef = doc(db, 'playerAuth', user.uid);
      const playerSnap = await getDoc(playerDocRef);
      
      let linkedPlayerId: string | null = null;
      if (playerSnap.exists()) {
        linkedPlayerId = playerSnap.data().playerId;
      } else if (user.email) {
        // Fallback 1: Query by email mapping existing auth table
        const authQ = query(collection(db, 'playerAuth'), where('email', '==', user.email));
        const authDocs = await getDocs(authQ);
        if (!authDocs.empty) {
          linkedPlayerId = authDocs.docs[0].data().playerId;
          await setDoc(playerDocRef, { playerId: linkedPlayerId, email: user.email });
        } else {
          // Fallback 2: Fuzzy match email to player names in db
          const allPlayersSnap = await getDocs(collection(db, 'players'));
          const emailStr = (user.email || '').toLowerCase();
          const emailPrefix = emailStr.split('@')[0].replace(/[^a-z0-9]/g, '');
          
          for (const p of allPlayersSnap.docs) {
             const pName = p.data().name.toLowerCase().replace(/\s/g, '');
             // Check exact matches or prefixes
             if (
                pName === emailPrefix || 
                pName.includes(emailPrefix) || 
                emailPrefix.includes(pName) ||
                pName.includes(emailStr)
             ) {
                linkedPlayerId = p.id;
                await setDoc(playerDocRef, { playerId: linkedPlayerId, email: user.email });
                break;
             }
          }
        }
      }

      if (linkedPlayerId) {
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
      profileImage: '/default-avatar.svg',
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
    sessionStorage.clear();
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
