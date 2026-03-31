import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

import { ElitePavillion } from './pages/ElitePavillion';
import { MatchHistory } from './pages/MatchHistory';
import { AdminScoring } from './pages/AdminScoring';
import { MatchDetails } from './pages/MatchDetails';

import { Stats } from './pages/Stats';
import { Squad } from './pages/Squad';

function App() {
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
