import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

import { ElitePavillion } from './pages/ElitePavillion';
import { MatchHistory } from './pages/MatchHistory';
import { AdminScoring } from './pages/AdminScoring';
import { MatchDetails } from './pages/MatchDetails';
import { PlayerProfile } from './pages/PlayerProfile';

// Stats is still a placeholder for now since it wasn't requested strictly yet, but we will add a simple placeholder.
const Stats = () => <div className="p-4 text-center mt-10"><h1>Stats Comming Soon</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ElitePavillion />} />
          <Route path="history" element={<MatchHistory />} />
          <Route path="stats" element={<Stats />} />
          <Route path="admin" element={<AdminScoring />} />
          <Route path="match/:id" element={<MatchDetails />} />
          <Route path="profile/:id" element={<PlayerProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
