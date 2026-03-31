import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

// Placeholder Pages (we will build these out next)
const ElitePavillion = () => <div className="p-4"><h1>Elite Pavillion (Leaderboard)</h1></div>;
const MatchHistory = () => <div className="p-4"><h1>Match History</h1></div>;
const Stats = () => <div className="p-4"><h1>Stats</h1></div>;
const AdminScoring = () => <div className="p-4"><h1>Admin Match Scoring</h1></div>;
const MatchDetails = () => <div className="p-4"><h1>Match Results</h1></div>;
const PlayerProfile = () => <div className="p-4"><h1>Player Profile</h1></div>;

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
