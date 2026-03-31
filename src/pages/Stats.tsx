import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Login } from './Login';
import styles from './Stats.module.css';
import { TrendingUp, Trophy, Target, Award, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPlayers, getMatches, getPlayerEntries } from '../lib/db';
import type { Player } from '../lib/db';
import { ImageUploader } from '../components/ImageUploader';
import { TeamBadge } from '../components/TeamBadge';

export const Stats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, playerData, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        const players = await getPlayers();
        setAllPlayers(players);

        // Find the target player (either from URL id or logged in user)
        let foundPlayer: Player | null = null;
        if (id) {
          foundPlayer = players.find(p => p.id === id) || null;
        } else if (playerData) {
          foundPlayer = players.find(p => p.id === playerData.id) || null;
        }
        
        if (!foundPlayer && players.length > 0) {
          // Fallback: show top player for admin
          foundPlayer = players[0];
        }
        setPlayer(foundPlayer);

        if (foundPlayer) {
          // Get match-by-match history for this player
          const entries = await getPlayerEntries(foundPlayer.id);
          const matches = await getMatches();
          
          const history = entries.map(e => {
            const match = matches.find(m => m.id === e.matchId);
            return {
              matchNumber: match?.matchNumber || 0,
              matchTitle: (match as any)?.matchTitle || `Match ${match?.matchNumber}`,
              score: e.score,
              rank: e.rank,
              pointsAwarded: e.pointsAwarded
            };
          }).sort((a, b) => a.matchNumber - b.matchNumber);

          setMatchHistory(history);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
      setLoading(false);
    };

    fetchStats();
  }, [currentUser, playerData, id]);

  if (!currentUser) return <Login />;
  if (loading) return (
    <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loader" style={{ alignSelf: 'center' }}></div>
    </div>
  );

  if (!player) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
          <h2>No Player Data</h2>
          <p>Your account is not linked to a player profile yet.</p>
        </div>
      </div>
    );
  }

  const playerRank = allPlayers.findIndex(p => p.id === player.id) + 1;
  const totalMatches = matchHistory.length;
  const avgPoints = totalMatches > 0 ? Math.round(player.metrics.totalPoints / totalMatches) : 0;

  
  // Build mini chart data (cumulative points over matches)
  let cumulative = 0;
  const chartData = matchHistory.map(m => {
    cumulative += m.pointsAwarded;
    return { match: m.matchNumber, total: cumulative, pts: m.pointsAwarded };
  });
  const maxPts = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Player Stats</h1>
      </header>

      {/* Profile Card */}
      <motion.div 
        className={styles.profileCard}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ marginRight: '1rem' }}>
          {(isAdmin || (playerData && playerData.id === player.id)) ? (
            <ImageUploader 
              playerId={player.id} 
              currentImage={player.profileImage} 
              onUploadSuccess={(url) => setPlayer({...player, profileImage: url})} 
              size={80} 
            />
          ) : (
            <img src={player.profileImage} alt={player.name} className={styles.profileAvatar} style={{ width: 80, height: 80, borderRadius: '50%' }} />
          )}
        </div>
        <div className={styles.profileInfo}>
          <h2>{player.name}</h2>
          <div style={{ margin: '0.25rem 0 0.5rem 0' }}><TeamBadge team={player.team} /></div>
          <span className={styles.rankTag}>RANK #{playerRank}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <motion.div className={styles.statCard} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Trophy size={20} color="#FFD700" />
          <span className={styles.statValue}>{player.metrics.totalPoints}</span>
          <span className={styles.statLabel}>TOTAL PTS</span>
        </motion.div>
        <motion.div className={styles.statCard} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <Award size={20} color="#22c55e" />
          <span className={styles.statValue}>{player.metrics.wins}</span>
          <span className={styles.statLabel}>WINS</span>
        </motion.div>
        <motion.div className={styles.statCard} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Target size={20} color="#3b82f6" />
          <span className={styles.statValue}>{player.metrics.top3}</span>
          <span className={styles.statLabel}>TOP 3</span>
        </motion.div>
        <motion.div className={styles.statCard} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
          <Zap size={20} color="#f97316" />
          <span className={styles.statValue}>{avgPoints}</span>
          <span className={styles.statLabel}>AVG PTS</span>
        </motion.div>
      </div>

      {/* Form */}
      <section className={styles.formSection}>
        <h3>Recent Form</h3>
        <div className={styles.formDots}>
          {(player.metrics.form || []).map((f, i) => (
            <span key={i} className={`${styles.formDot} ${f === 'W' ? styles.formWin : f === 'L' ? styles.formLoss : styles.formDraw}`}>
              {f}
            </span>
          ))}
          {(!player.metrics.form || player.metrics.form.length === 0) && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No matches played yet</span>
          )}
        </div>
      </section>

      {/* Badges & Achievements */}
      <section className={styles.badgesSection}>
        <h3><Award size={16} /> Achievements</h3>
        <div className={styles.badgesGrid}>
           {player.metrics.wins >= 1 && (
             <div className={styles.badgeItem}>
               <div className={styles.badgeIconGold}><Trophy size={20}/></div>
               <span className={styles.badgeTitle}>First Blood</span>
               <span className={styles.badgeDesc}>Secured an MVP rank</span>
             </div>
           )}
           {player.metrics.wins >= 3 && (
             <div className={styles.badgeItem}>
               <div className={styles.badgeIconDiamond}><Crown size={20}/></div>
               <span className={styles.badgeTitle}>Dominator</span>
               <span className={styles.badgeDesc}>3+ MVP Ranks</span>
             </div>
           )}
           {player.metrics.top3 >= 5 && (
             <div className={styles.badgeItem}>
               <div className={styles.badgeIconSilver}><Award size={20}/></div>
               <span className={styles.badgeTitle}>Podium Regular</span>
               <span className={styles.badgeDesc}>5+ Top-3 finishes</span>
             </div>
           )}
           {(player.metrics.form || []).slice(0,3).every(f => f === 'W') && (player.metrics.form || []).length >= 3 && (
             <div className={styles.badgeItem}>
               <div className={styles.badgeIconFire}><Zap size={20}/></div>
               <span className={styles.badgeTitle}>Hot Streak</span>
               <span className={styles.badgeDesc}>3 consecutive podiums</span>
             </div>
           )}
           
           {/* Empty State */}
           {player.metrics.wins === 0 && player.metrics.top3 < 5 && (!(player.metrics.form || []).slice(0,3).every(f => f === 'W') || (player.metrics.form || []).length < 3) && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', gridColumn: 'span 2' }}>Play more matches to unlock achievements!</p>
           )}
        </div>
      </section>

      {/* Growth Chart */}
      {chartData.length > 0 && (
        <section className={styles.chartSection}>
          <h3><TrendingUp size={16} /> Points Growth</h3>
          <div className={styles.chartContainer}>
            <div className={styles.chartBars}>
              {chartData.map((d, i) => (
                <motion.div 
                  key={i} 
                  className={styles.chartBar}
                  initial={{ height: 0 }} 
                  animate={{ height: `${(d.total / maxPts) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <span className={styles.barLabel}>+{d.pts}</span>
                </motion.div>
              ))}
            </div>
            <div className={styles.chartLabels}>
              {chartData.map((d, i) => (
                <span key={i}>M{d.match}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Match-by-Match History */}
      <section className={styles.historySection}>
        <h3>Match History</h3>
        {matchHistory.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No match data yet.</p>}
        {matchHistory.map((m, i) => (
          <motion.div 
            key={i} className={styles.historyRow}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          >
            <div className={styles.historyLeft}>
              <span className={styles.historyMatchNum}>M{m.matchNumber}</span>
              <div>
                <p className={styles.historyTitle}>{m.matchTitle}</p>
                <p className={styles.historyScore}>Score: {m.score}</p>
              </div>
            </div>
            <div className={styles.historyRight}>
              <span className={`${styles.historyRank} ${m.rank <= 3 ? styles.historyRankGold : ''}`}>
                #{m.rank}
              </span>
              <span className={styles.historyPts}>+{m.pointsAwarded}</span>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
};
