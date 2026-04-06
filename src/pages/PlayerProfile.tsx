import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Award, TrendingUp } from 'lucide-react';
import { getPlayers, getPlayerEntries, computeAchievements, computeStreaks } from '../lib/db';
import type { Player, Entry } from '../lib/db';
import { Achievements } from '../components/Achievements';

export const PlayerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getPlayers(),
      getPlayerEntries(id)
    ]).then(([players, e]) => {
      const p = players.find(x => x.id === id);
      if (p) setPlayer(p);
      setEntries(e);
    });
  }, [id]);

  if (!player) return <div style={{padding: '2rem'}}>Loading...</div>;

  const streaks = computeStreaks(entries);
  const achievements = computeAchievements(player, entries);

  return (
    <div style={{ minHeight: '100vh', padding: 'max(env(safe-area-inset-top, 20px), 20px) 20px 100px', background: 'var(--bg-main)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-primary)', cursor:'pointer' }}>
          <ArrowLeft size={24} />
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <img src={player.profileImage || "/default-avatar.svg"} alt={player.name} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-primary)', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{player.name}</h1>
        {player.team && <p style={{ color: 'var(--text-secondary)' }}>{player.team}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
         <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
             <Target size={24} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem' }} />
             <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{player.metrics.totalPoints}</div>
             <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total PTS</div>
         </div>
         <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
             <TrendingUp size={24} style={{ color: '#22c55e', margin: '0 auto 0.5rem' }} />
             <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{streaks.bestWinStreak}</div>
             <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Best Streak</div>
         </div>
         <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
             <Award size={24} style={{ color: '#eab308', margin: '0 auto 0.5rem' }} />
             <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{achievements.filter(a => a.earned).length}</div>
             <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Badges</div>
         </div>
      </div>

      <Achievements achievements={achievements} />

      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} color="var(--accent-primary)"/> Match History 
        </h3>
        
        {entries.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No matches played yet.</p>}
        {entries.slice().reverse().map((e, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>MATCH {entries.length - idx}</div>
              <div style={{ fontWeight: 600 }}>Rank #{e.rank}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>+{e.pointsAwarded} PTS</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score: {e.score}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
