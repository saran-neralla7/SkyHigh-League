import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

import { ElitePavillion } from './pages/ElitePavillion';
import { MatchHistory } from './pages/MatchHistory';
import { AdminScoring } from './pages/AdminScoring';
import { MatchDetails } from './pages/MatchDetails';

import { Stats } from './pages/Stats';
import { Squad } from './pages/Squad';

import { useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

function App() {
  useEffect(() => {
    const runAvatarMigration = async () => {
      try {
        const snapshot = await getDocs(collection(db, "players"));
        snapshot.forEach(async (pDoc) => {
          const data = pDoc.data();
          if (data.name?.includes("Saran Neralla") && data.profileImage !== "/avatars/saran.jpg") {
             await updateDoc(doc(db, "players", pDoc.id), { profileImage: "/avatars/saran.jpg" });
             console.log("Migrated Saran Avatar!");
          }
        });
      } catch (e) {
        console.error("Migration failed", e);
      }
    };
    runAvatarMigration();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ElitePavillion />} />
          <Route path="history" element={<MatchHistory />} />
          <Route path="stats" element={<Stats />} />
          <Route path="squad" element={<Squad />} />
          <Route path="admin" element={<AdminScoring />} />
          <Route path="match/:id" element={<MatchDetails />} />
          <Route path="profile/:id" element={<Stats />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
