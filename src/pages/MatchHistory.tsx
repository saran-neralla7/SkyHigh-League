import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MatchHistory.module.css';
import { ArrowLeft, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMatches, getMatchEntries, getPlayers, getPlayerEntries } from '../lib/db';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MatrixTable } from '../components/MatrixTable';
import { useAuth } from '../AuthContext';

interface PastMatch {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  topPerformers: string[];
  resultPoints: number;
  rawScore?: number;
  mvpName?: string;
}

export const MatchHistory: React.FC = () => {
  const navigate = useNavigate();
  const { playerData } = useAuth();
  const [matches, setMatches] = useState<PastMatch[]>([]);
  const [headerPoints, setHeaderPoints] = useState(0);
  const [headerLabel, setHeaderLabel] = useState('TOTAL POINTS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
       try {
         const dbMatches = await getMatches();
         const dbPlayers = await getPlayers();
         
         if (playerData) {
            const myEntries = await getPlayerEntries(playerData.id);
            const myTotalRaw = myEntries.reduce((sum, e) => sum + e.score, 0);
            setHeaderPoints(myTotalRaw);
            setHeaderLabel('RAW POINTS');
         } else {
            const eSnap = await getDocs(collection(db, 'entries'));
            const allE = eSnap.docs.map(d => d.data());
            const totalLeagueRaw = allE.reduce((sum, e) => sum + e.score, 0);
            setHeaderPoints(totalLeagueRaw);
            setHeaderLabel('LEAGUE RAW SCORES');
         }

         const formattedMatches = await Promise.all(dbMatches.map(async (m) => {
            const entries = await getMatchEntries(m.id);
            const topEntries = entries.filter(e => e.rank <= 3).sort((a,b) => a.rank - b.rank);
            const avatars = topEntries.map(e => {
               const player = dbPlayers.find(p => p.id === e.playerId);
               return player ? player.profileImage : '/default-avatar.svg';
            });
            const topScore = topEntries.length > 0 ? topEntries[0].pointsAwarded : 0;
            const topRaw = topEntries.length > 0 ? topEntries[0].score : undefined;
            const mvpPlayer = topEntries.length > 0 ? dbPlayers.find(p => p.id === topEntries[0].playerId) : null;

            const myEntry = playerData ? entries.find(e => e.playerId === playerData.id) : null;
            const displayScore = myEntry ? myEntry.pointsAwarded : topScore;
            const displayRaw = myEntry ? myEntry.score : topRaw;

            const dateStr = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : 'Recently';

            return {
               id: m.id,
               name: `MATCH ${m.matchNumber}`,
               subtitle: (m as any).matchTitle || '',
               date: dateStr,
               topPerformers: avatars,
               resultPoints: displayScore,
               rawScore: displayRaw,
               mvpName: mvpPlayer?.name
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

  if (loading) return (
    <div className={styles.container} style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
       <div className="loader"></div>
    </div>
  );

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
             <span className={styles.totalValue}>{headerPoints.toLocaleString()}</span>
             <span className={styles.labelTotal}>{headerLabel}</span>
           </div>
        </div>
        <div className={styles.progressBarWrapper}>
           <div className={styles.progressFill} style={{ width: `${Math.min((matches.length / 20) * 100, 100)}%` }}></div>
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
               {match.subtitle && <p style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{match.subtitle}</p>}
               <p>{match.date}</p>
             </div>
             
             <div className={styles.performers}>
               <span className={styles.performersLabel}>TOP PERFORMERS</span>
               <div className={styles.avatarGroup}>
                 {match.topPerformers.map((av, i) => (
                   <img key={i} src={av} className={styles.tinyAvatar} style={{ zIndex: 3 - i }} alt="Performer" />
                 ))}
               </div>
               {match.mvpName && <span style={{ fontSize: '0.65rem', color: '#EAB308', fontWeight: 600 }}>👑 MVP: {match.mvpName}</span>}
             </div>

             <div className={styles.resultDetails}>
                <span className={match.resultPoints > 0 ? styles.pointsPositive : styles.pointsNeutral}>
                  {match.resultPoints > 0 ? `+${match.resultPoints}` : `+0`} <span className={styles.ptsLabel}>PTS</span>
                </span>
                <span className={styles.resultStatus}>
                  {match.rawScore !== undefined ? `${match.rawScore} RAW SCORE` : (match.resultPoints > 0 ? 'ELITE REWARD' : 'NO POINTS')}
                </span>
             </div>
          </motion.div>
        ))}

        {matches.length === 0 && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
            <Award size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>No matches played yet.</p>
          </div>
        )}
      </div>

      {matches.length > 0 && <MatrixTable />}
    </div>
  );
};
