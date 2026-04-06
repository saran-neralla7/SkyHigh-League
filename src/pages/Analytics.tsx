import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ArrowLeft, Percent, TrendingDown, Crosshair, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlayerEntries } from '../lib/db';
import type { Player, Entry } from '../lib/db';
import { useAuth } from '../AuthContext';
import { Login } from './Login';
import styles from './Analytics.module.css';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, playerData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (playerData) {
      setPlayer(playerData);
      getPlayerEntries(playerData.id).then(e => {
        setEntries(e);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [playerData]);

  if (!currentUser) return <Login />;
  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading analytics...</div></div>;
  if (!player) return <div className={styles.container}>Player not found.</div>;

  const totalMatches = entries.length;
  const winRate = totalMatches > 0 ? ((player.metrics.wins / totalMatches) * 100).toFixed(1) : '0';
  const consistencyScore = totalMatches > 0 ? (totalMatches - entries.filter(e => e.rank >= 5).length) / totalMatches * 100 : 0;
  
  // Clutch factor: Did they score > avg when previous match was a loss?
  let clutchMoments = 0;
  let pressureSituations = 0;
  for (let i = 1; i < entries.length; i++) {
    if (entries[i-1].rank >= 4) {
      pressureSituations++;
      if (entries[i].score > player.metrics.average) clutchMoments++;
    }
  }
  const clutchRating = pressureSituations > 0 ? ((clutchMoments / pressureSituations) * 100).toFixed(0) : '0';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.titleWrapper}>
          <BarChart3 size={20} className={styles.titleIcon} />
          <h1>Deep Analytics</h1>
        </div>
      </header>

      <div className={styles.grid}>
        <motion.div className={styles.statCard} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}}>
          <Percent className={styles.statIcon} size={24} />
          <div className={styles.statValue}>{winRate}%</div>
          <div className={styles.statLabel}>WIN RATE</div>
        </motion.div>

        <motion.div className={styles.statCard} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}}>
          <TrendingDown className={styles.statIcon} size={24} />
          <div className={styles.statValue}>{player.metrics.average.toFixed(1)}</div>
          <div className={styles.statLabel}>AVG PTS / MATCH</div>
        </motion.div>

        <motion.div className={styles.statCard} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}}>
          <Crosshair className={styles.statIcon} size={24} />
          <div className={styles.statValue}>{consistencyScore.toFixed(0)}</div>
          <div className={styles.statLabel}>CONSISTENCY INDEX</div>
        </motion.div>

        <motion.div className={styles.statCard} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.4}}>
          <Flame className={styles.statIcon} size={24} />
          <div className={styles.statValue}>{clutchRating}</div>
          <div className={styles.statLabel}>CLUTCH RATING</div>
        </motion.div>
      </div>

      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Ranking Distribution</h3>
        <div className={styles.distributionBar}>
          <div className={styles.distSegment} style={{width: `${(player.metrics.wins / totalMatches) * 100}%`, background: 'var(--accent-primary)'}}><span style={{color: 'black'}}>{player.metrics.wins} W</span></div>
          <div className={styles.distSegment} style={{width: `${((player.metrics.top3 - player.metrics.wins) / totalMatches) * 100}%`, background: '#94a3b8'}}><span style={{color: 'black'}}>{player.metrics.top3 - player.metrics.wins}</span></div>
          <div className={styles.distSegment} style={{width: `${((totalMatches - player.metrics.top3) / totalMatches) * 100}%`, background: '#ef4444'}}><span>{totalMatches - player.metrics.top3}</span></div>
        </div>
        <div className={styles.distLegend}>
          <span><div className={styles.legendDot} style={{background: 'var(--accent-primary)'}}></div> 1st Place</span>
          <span><div className={styles.legendDot} style={{background: '#94a3b8'}}></div> 2nd-3rd Place</span>
          <span><div className={styles.legendDot} style={{background: '#ef4444'}}></div> Bottom Finish</span>
        </div>
      </div>
    </div>
  );
};
