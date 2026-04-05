import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Squad.module.css';
import { Users, Trophy, TrendingUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPlayers } from '../lib/db';
import type { Player } from '../lib/db';
import { TeamBadge } from '../components/TeamBadge';
import { sounds } from '../lib/sounds';

export const Squad: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const dbPlayers = await getPlayers();
        setPlayers(dbPlayers);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div className={styles.container} style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="loader"></div>
    </div>
  );

  const topPlayer = players.length > 0 ? players[0] : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Users size={24} color="var(--accent-primary)" />
          <h1>Squad Directory</h1>
        </div>
        <span className={styles.playerCount}>{players.length} PLAYERS</span>
      </header>

      {/* MVP Highlight */}
      {topPlayer && (
        <motion.div 
          className={styles.mvpCard}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.mvpGlow}></div>
          <Crown size={24} color="#FFD700" className={styles.mvpCrown} />
          <img src={topPlayer.profileImage} alt={topPlayer.name} className={styles.mvpAvatar} />
          <div className={styles.mvpInfo}>
            <span className={styles.mvpTag}>CURRENT LEADER</span>
            <h2>{topPlayer.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <TeamBadge team={topPlayer.team} />
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>• {topPlayer.metrics.totalPoints} PTS</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Squad List */}
      <div className={styles.squadList}>
        {players.map((player, index) => {
          const rank = index + 1;
          return (
            <motion.div
              key={player.id}
              className={styles.playerRow}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => {
                sounds.playSwoosh();
                navigate(`/profile/${player.id}`);
              }}
            >
              <div className={styles.playerLeft}>
                <span className={`${styles.playerRank} ${rank <= 3 ? styles.rankGold : ''}`}>
                  {rank}
                </span>
                <img src={player.profileImage} alt={player.name} className={styles.playerAvatar} />
                <div className={styles.playerDetails}>
                  <h3>{player.name}</h3>
                  <div style={{ marginTop: '0.25rem' }}><TeamBadge team={player.team} /></div>
                </div>
              </div>
              <div className={styles.playerRight}>
                <div className={styles.playerStats}>
                  <div className={styles.miniStat}>
                    <Trophy size={12} color="#FFD700" />
                    <span>{player.metrics.wins}</span>
                  </div>
                  <div className={styles.miniStat}>
                    <TrendingUp size={12} color="#22c55e" />
                    <span>{player.metrics.top3}</span>
                  </div>
                </div>
                <span className={styles.playerPts}>{player.metrics.totalPoints} PTS</span>
                {/* Form Dots */}
                <div className={styles.formRow}>
                  {(player.metrics.form || []).map((f, i) => (
                    <span key={i} className={`${styles.dotSmall} ${f === 'W' ? styles.dotWin : f === 'L' ? styles.dotLoss : styles.dotDraw}`}></span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
          <h2>No Players Yet</h2>
          <p>Ask the admin to add players in the Arena tab.</p>
        </div>
      )}
    </div>
  );
};
