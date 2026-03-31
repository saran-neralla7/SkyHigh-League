import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MatchHistory.module.css';
import { ArrowLeft, Award, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PastMatch {
  id: string;
  name: string;
  date: string;
  topPerformers: string[]; // avatar urls
  resultPoints: number; // positive or 0
}

const mockMatches: PastMatch[] = [
  { id: '12', name: 'MATCH 12', date: 'Oct 24, 2023', topPerformers: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3'], resultPoints: 50 },
  { id: '11', name: 'MATCH 11', date: 'Oct 21, 2023', topPerformers: ['https://i.pravatar.cc/150?u=4', 'https://i.pravatar.cc/150?u=5', 'https://i.pravatar.cc/150?u=6'], resultPoints: 0 },
  { id: '10', name: 'MATCH 10', date: 'Oct 18, 2023', topPerformers: ['https://i.pravatar.cc/150?u=7', 'https://i.pravatar.cc/150?u=8', 'https://i.pravatar.cc/150?u=9'], resultPoints: 30 },
];

export const MatchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<PastMatch[]>([]);

  useEffect(() => {
    setMatches(mockMatches);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
          <h1>Match History</h1>
        </div>
        <Award size={24} color="#FFD700" />
      </header>

      <section className={styles.seasonSummary}>
        <div className={styles.summaryTop}>
           <div className={styles.matchesCount}>
             <span className={styles.bigNumber}>42</span>
             <span className={styles.label}>MATCHES</span>
           </div>
           <div className={styles.totalPointsText}>
             <span className={styles.totalValue}>2,855</span>
             <span className={styles.labelTotal}>TOTAL POINTS</span>
           </div>
        </div>
        <div className={styles.progressBarWrapper}>
           <div className={styles.progressFill} style={{ width: '65%' }}></div>
        </div>
      </section>

      <div className={styles.list}>
        {matches.map((match, idx) => (
          <motion.div 
            key={match.id}
            className={styles.matchCard}
            onClick={() => navigate(`/match/${match.id}`)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
             <div className={styles.matchInfo}>
               <h2>{match.name}</h2>
               <p>{match.date}</p>
             </div>
             
             <div className={styles.performers}>
               <span className={styles.performersLabel}>TOP PERFORMERS</span>
               <div className={styles.avatarGroup}>
                 {match.topPerformers.map((av, i) => (
                   <img key={i} src={av} className={styles.tinyAvatar} style={{ zIndex: 3 - i }} alt="Performer" />
                 ))}
               </div>
             </div>

             <div className={styles.resultDetails}>
                <span className={match.resultPoints > 0 ? styles.pointsPositive : styles.pointsNeutral}>
                  {match.resultPoints > 0 ? `+${match.resultPoints}` : match.resultPoints} <span className={styles.ptsLabel}>PTS</span>
                </span>
                <span className={styles.resultStatus}>
                  {match.resultPoints > 0 ? 'ELITE REWARD' : 'NO POINTS'}
                </span>
             </div>
          </motion.div>
        ))}

        <button className={styles.loadMoreBtn}>
           <RotateCcw size={16} />
           LOAD PREVIOUS MATCHES
        </button>
      </div>
    </div>
  );
};
