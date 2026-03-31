import React, { useState, useEffect } from 'react';
import styles from './ElitePavillion.module.css';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

// Mock types for UI build
interface StandingsPlayer {
  id: string;
  rank: number;
  name: string;
  points: string;
  avatar: string;
  movement: number; // positive for up, negative for down, 0 for steady
  form: ('W'|'L'|'D')[]; // simplified last 5 matches
}

const mockStandings: StandingsPlayer[] = [
  { id: '1', rank: 1, name: 'Rohan Das', points: '2,855', avatar: 'https://i.pravatar.cc/150?u=rohan', movement: 0, form: ['W','W','W','L','W'] },
  { id: '2', rank: 2, name: 'Vikram S.', points: '2,410', avatar: 'https://i.pravatar.cc/150?u=vikram', movement: 0, form: ['W','L','W','W','D'] },
  { id: '3', rank: 3, name: 'Zoya K.', points: '2,380', avatar: 'https://i.pravatar.cc/150?u=zoya', movement: 1, form: ['L','W','W','W','L'] },
  { id: '4', rank: 4, name: 'Isha Sharma', points: '2,215', avatar: 'https://i.pravatar.cc/150?u=isha', movement: 2, form: ['W','D','L','L','W'] },
  { id: '5', rank: 5, name: 'Kabir Singh', points: '2,190', avatar: 'https://i.pravatar.cc/150?u=kabir', movement: -1, form: ['L','L','W','L','D'] },
  { id: '6', rank: 6, name: 'Priya Verma', points: '2,050', avatar: 'https://i.pravatar.cc/150?u=priya', movement: 0, form: ['D','L','L','L','L'] },
];

export const ElitePavillion: React.FC = () => {
  const [standings, setStandings] = useState<StandingsPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In final, fetch from DB. Using mock to build strict UI based on image.
    setStandings(mockStandings);
    setLoading(false);

    // Premium subtle confetti trigger for Rank 1 (mocking "new" rank 1 arrival)
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FDE047', '#FFFFFF'],
        disableForReducedMotion: true,
      });
    }, 800);
  }, []);

  if (loading) return <div>Loading...</div>;

  const podium = [standings[1], standings[0], standings[2]]; // Rank 2, 1, 3
  const rest = standings.slice(3);

  const getFormColor = (f: 'W'|'L'|'D') => {
    if (f === 'W') return '#22c55e';
    if (f === 'L') return '#ef4444';
    return '#52525b'; // Draw/neutral
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="https://i.pravatar.cc/150?u=user" alt="User" className={styles.userAvatar} />
          <h1>ELITE PAVILLION</h1>
        </div>
        <button className={styles.bellBtn}>
          <Bell size={20} color="#FFD700" />
        </button>
      </header>

      {/* Podium Section */}
      <section className={styles.podiumSection}>
         <div className={styles.podiumContainer}>
            {/* Rank 2 */}
            <motion.div 
               className={`${styles.podiumItem} ${styles.rank2}`}
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
               <div className={styles.avatarWrapper}>
                 <img src={podium[0].avatar} alt={podium[0].name} className={styles.podiumAvatar} />
                 <span className={styles.badge2}>2</span>
               </div>
               <div className={styles.podiumDetails}>
                 <p className={styles.podiumName}>{podium[0].name}</p>
                 <p className={styles.podiumPoints}>{podium[0].points}</p>
               </div>
            </motion.div>

            {/* Rank 1 */}
            <motion.div 
               className={`${styles.podiumItem} ${styles.rank1}`}
               initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            >
               <div className={styles.avatarWrapperRank1}>
                 <div className={styles.haloEffect}></div>
                 <img src={podium[1].avatar} alt={podium[1].name} className={styles.podiumAvatarRank1} />
                 <div className={styles.badge1}>
                   <img src="/crown.svg" alt="Rank 1" className={styles.crownIconBadge} />
                 </div>
               </div>
               <div className={styles.podiumDetailsRank1}>
                 <p className={styles.podiumNameRank1}>{podium[1].name}</p>
                 <p className={styles.podiumPointsRank1}>{podium[1].points}</p>
               </div>
            </motion.div>

            {/* Rank 3 */}
            <motion.div 
               className={`${styles.podiumItem} ${styles.rank3}`}
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
               <div className={styles.avatarWrapper}>
                 <img src={podium[2].avatar} alt={podium[2].name} className={styles.podiumAvatar} />
                 <span className={styles.badge3}>3</span>
               </div>
               <div className={styles.podiumDetails}>
                 <p className={styles.podiumName}>{podium[2].name}</p>
                 <p className={styles.podiumPoints}>{podium[2].points}</p>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Full Standings Title */}
      <div className={styles.sectionEyebrow}>FULL STANDINGS</div>

      {/* List */}
      <section className={styles.standingsList}>
         {rest.map((player, idx) => (
           <motion.div 
              key={player.id} 
              className={styles.standingsRow}
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.4 + (idx * 0.05) }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
           >
              <div className={styles.rankNumber}>{player.rank}</div>
              
              <div className={styles.playerMainInfo}>
                <div className={styles.topRow}>
                  <img src={player.avatar} alt={player.name} className={styles.rowAvatar} />
                  <div className={styles.nameBlock}>
                    <p className={styles.rowName}>{player.name}</p>
                    <div className={styles.movement}>
                      {player.movement > 0 && <span className={styles.moveUp}>↑ {player.movement}</span>}
                      {player.movement < 0 && <span className={styles.moveDown}>↓ {Math.abs(player.movement)}</span>}
                      {player.movement === 0 && <span className={styles.moveSteady}>— 0</span>}
                    </div>
                  </div>
                </div>
                <div className={styles.last5Matches}>
                  <span className={styles.last5Label}>LAST 5 MATCHES</span>
                  <div className={styles.dots}>
                    {player.form.map((f, i) => (
                      <span key={i} className={styles.dot} style={{ backgroundColor: getFormColor(f) }}></span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.rowPoints}>{player.points}</div>
           </motion.div>
         ))}
      </section>
    </div>
  );
};
