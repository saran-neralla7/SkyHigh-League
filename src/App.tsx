import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

import { ElitePavillion } from './pages/ElitePavillion';
import { MatchHistory } from './pages/MatchHistory';
import { AdminScoring } from './pages/AdminScoring';
import { MatchDetails } from './pages/MatchDetails';

import { Stats } from './pages/Stats';
import { Squad } from './pages/Squad';
import { Analytics } from './pages/Analytics';
import { HallOfFame } from './pages/HallOfFame';
import { HeadToHead } from './pages/HeadToHead';
import { PlayerProfile } from './pages/PlayerProfile';

import { useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

function App() {
  useEffect(() => {
    const runAvatarMigration = async () => {
      try {
        const snapshot = await getDocs(collection(db, "players"));
        
        const avatarMap: Record<string, string> = {
          "Saran": "/avatars/saran.jpg",
          "Sunny": "/avatars/sunny.jpg",
          "Deepak": "/avatars/deepak.jpg",
          "Prabhas": "/avatars/prabhas.jpg",
          "Sailesh": "/avatars/sailesh.jpg",
          "Sashank": "/avatars/sashank.jpg",
          "Suraj": "/avatars/suraj.jpg",
          "Pavan": "/avatars/pavan.jpg"
        };

        snapshot.forEach(async (pDoc) => {
          const data = pDoc.data();
          const name = data.name || "";
          const isPravatar = data.profileImage?.includes('pravatar');
          
          let updatedUrl = null;
          
          Object.keys(avatarMap).forEach(key => {
             if (name.includes(key) && data.profileImage !== avatarMap[key]) {
                 updatedUrl = avatarMap[key];
             }
          });

          if (updatedUrl) {
             await updateDoc(doc(db, "players", pDoc.id), { profileImage: updatedUrl });
             console.log(`Migrated ${name} Avatar!`);
          } else if (isPravatar) {
             await updateDoc(doc(db, "players", pDoc.id), { profileImage: "/default-avatar.svg" });
             console.log("Purged random dummy Pravatar profile!");
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
          <Route element={<Layout />}>
            <Route path="/" element={<ElitePavillion />} />
            <Route path="/squad" element={<Squad />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/admin" element={<AdminScoring />} />
            <Route path="/matches" element={<MatchHistory />} />
          </Route>

          {/* Standalone immersive routes without bottom nav */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/compare" element={<HeadToHead />} />
          <Route path="/match/:id" element={<MatchDetails />} />
          <Route path="/profile/:id" element={<PlayerProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
