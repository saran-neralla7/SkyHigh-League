import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ArrowLeft, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './HallOfFame.module.css';
import confetti from 'canvas-confetti';

interface SeasonData {
  id: string;
  archivedAt: any;
  standings: {
    rank: number;
    name: string;
    avatar: string;
    points: number;
    wins: number;
  }[];
}

export const HallOfFame: React.FC = () => {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const q = query(collection(db, 'seasons'), orderBy('archivedAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SeasonData));
        setSeasons(data);

        if (data.length > 0) {
          setTimeout(() => {
            confetti({
               particleCount: 100,
               spread: 120,
               origin: { y: 0.3 },
               colors: ['#FFD700', '#FDE047']
            });
          }, 300);
        }
      } catch(err) {
        console.error("Failed to load Hall of Fame:", err);
      }
      setLoading(false);
    };

    loadSeasons();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.titleWrapper}>
          <Trophy size={20} className={styles.titleIcon} />
          <h1>Hall of Fame</h1>
        </div>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading archived seasons...</div>
        ) : seasons.length === 0 ? (
          <div className={styles.empty}>
            <Trophy size={64} className={styles.emptyIcon} />
            <p>No champions yet.</p>
            <span>Finish a season to cement your legacy.</span>
          </div>
        ) : (
          <div className={styles.timeline}>
            {seasons.map((season, i) => (
              <motion.div 
                key={season.id} 
                className={styles.seasonCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <div className={styles.seasonHeader}>
                  <div className={styles.seasonBadge}>{season.id.toUpperCase()}</div>
                  {season.archivedAt && (
                    <div className={styles.seasonDate}>{new Date(season.archivedAt.toDate()).toLocaleDateString()}</div>
                  )}
                </div>

                <div className={styles.podium}>
                  {season.standings.slice(0, 3).map((p) => (
                    <div key={p.rank} className={`${styles.podiumSpot} ${p.rank===1 ? styles.spotGold : p.rank===2 ? styles.spotSilver : styles.spotBronze}`}>
                      <div className={styles.avatarWrapper}>
                        <img src={p.avatar} alt={p.name} />
                        {p.rank === 1 && <span className={styles.crown}>👑</span>}
                      </div>
                      <div className={styles.podiumName}>{p.name}</div>
                      <div className={styles.podiumStats}>{p.points} PTS • {p.wins} W</div>
                    </div>
                  ))}
                </div>

                {season.standings.length > 3 && (
                  <div className={styles.restOfList}>
                    {season.standings.slice(3).map(p => (
                      <div key={p.rank} className={styles.restRow}>
                        <span className={styles.restRank}>#{p.rank}</span>
                        <img src={p.avatar} alt={p.name} className={styles.restAvatar}/>
                        <span className={styles.restName}>{p.name}</span>
                        <span className={styles.restPoints}>{p.points} PTS</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
