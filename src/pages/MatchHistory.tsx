import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MatchHistory.module.css';
import { ArrowLeft, Award, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

import { getMatches, getMatchEntries, getPlayers } from '../lib/db';

interface PastMatch {
  id: string;
  name: string;
  date: string;
  topPerformers: string[]; // avatar urls
  resultPoints: number; // For history list, maybe max points given
}

export const MatchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<PastMatch[]>([]);
  const [totalLeaguesPoints, setTotalLeaguePoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
       try {
         const dbMatches = await getMatches();
         const dbPlayers = await getPlayers();
         
         const totalPts = dbPlayers.reduce((sum, p) => sum + p.metrics.totalPoints, 0);
         setTotalLeaguePoints(totalPts);

         const formattedMatches = await Promise.all(dbMatches.map(async (m) => {
            const entries = await getMatchEntries(m.id);
            const topEntries = entries.filter(e => e.rank <= 3).sort((a,b) => a.rank - b.rank);
            const avatars = topEntries.map(e => {
               const player = dbPlayers.find(p => p.id === e.playerId);
               return player ? player.profileImage : 'https://i.pravatar.cc/150';
            });
            const topScore = topEntries.length > 0 ? topEntries[0].pointsAwarded : 0;

            const dateStr = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : 'Recently';

            return {
               id: m.id,
               name: `MATCH ${m.matchNumber}`,
               date: dateStr,
               topPerformers: avatars,
               resultPoints: topScore
            };
         }));
         
         setMatches(formattedMatches);
       } catch (err) {
         console.error("Error fetching match history", err);
       }
       setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Loading History...</div>;

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
             <span className={styles.bigNumber}>{matches.length}</span>
             <span className={styles.label}>MATCHES</span>
           </div>
           <div className={styles.totalPointsText}>
             <span className={styles.totalValue}>{totalLeaguesPoints.toLocaleString()}</span>
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
