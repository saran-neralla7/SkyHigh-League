import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (username: string, pass: string) => {
    // DEV ONLY MOCK
    if (import.meta.env.VITE_FIREBASE_API_KEY === undefined || import.meta.env.VITE_FIREBASE_API_KEY === '') {
      console.warn("Using Dev Mock Login");
      if (username === 'saran' && pass === 'Saran190721') {
        setCurrentUser({ email: 'admin@shc.com' } as User);
        return;
      } else {
        throw new Error("Invalid mock credentials");
      }
    }

    // Translate the simple username "saran" to the firebase email created
    const email = username.toLowerCase() === 'saran' ? 'admin@shc.com' : username;
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => signOut(auth);

  const isAdmin = currentUser?.email === 'admin@shc.com';

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
