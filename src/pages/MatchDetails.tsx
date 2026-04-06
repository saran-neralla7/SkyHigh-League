import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash } from 'lucide-react';
import { getMatch, getMatchEntries, getPlayers } from '../lib/db';
import type { Match, Entry } from '../lib/db';
import { ChatFeed } from '../components/ChatFeed';

export const MatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getMatch(id),
      getMatchEntries(id),
      getPlayers()
    ]).then(([m, e, p]) => {
      setMatch(m as Match);
      setEntries(e);
      setPlayers(p);
    });
  }, [id]);

  if (!match) return <div style={{padding: '2rem'}}>Loading...</div>;

  const getPlayerName = (pid: string) => players.find(p => p.id === pid)?.name || 'Unknown';
  const getPlayerAvatar = (pid: string) => players.find(p => p.id === pid)?.profileImage || '/default-avatar.svg';

  return (
    <div style={{ minHeight: '100vh', padding: 'max(env(safe-area-inset-top, 20px), 20px) 20px 100px', background: 'var(--bg-main)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-primary)', cursor:'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Hash size={20} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Match {match.matchNumber}</h1>
        </div>
      </header>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Match Results</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...entries].sort((a,b) => a.rank - b.rank).map((entry, i) => (
            <motion.div 
              key={entry.id} 
              initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: i*0.1}}
              style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}
            >
              <div style={{ fontWeight: 800, color: entry.rank <= 3 ? 'var(--accent-primary)' : 'var(--text-tertiary)', width: '30px' }}>#{entry.rank}</div>
              <img src={getPlayerAvatar(entry.playerId)} alt="avatar" style={{width: 36, height: 36, borderRadius: '50%', marginRight: '1rem', objectFit: 'cover'}} />
              <div style={{ flex: 1, fontWeight: 600 }}>{getPlayerName(entry.playerId)}</div>
              <div style={{ fontWeight: 800 }}>{entry.score} PTS</div>
            </motion.div>
          ))}
        </div>
      </div>

      <ChatFeed matchId={match.id} />
    </div>
  );
};
