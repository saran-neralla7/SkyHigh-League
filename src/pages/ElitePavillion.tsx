import React, { useState, useEffect } from 'react';
import styles from './ElitePavillion.module.css';
import { Bell, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toBlob } from 'html-to-image';
import { getPlayers } from '../lib/db';
import type { Player } from '../lib/db';

export const ElitePavillion: React.FC = () => {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
       try {
         const dbPlayers = await getPlayers();
         
         let currentRank = 1;
         const finalStandings = dbPlayers.map((p: Player, index: number) => {
            if (index > 0) {
               const prevP = dbPlayers[index - 1];
               if (p.metrics.totalPoints < prevP.metrics.totalPoints) {
                 currentRank = index + 1;
               }
            }
            return {
               id: p.id,
               rank: currentRank,
               name: p.name,
               points: p.metrics.totalPoints.toLocaleString(),
               avatar: p.profileImage?.includes('pravatar') ? '/default-avatar.svg' : (p.profileImage || '/default-avatar.svg'),
               movement: 0,
               form: p.metrics.form || []
            }
         });
         
         setStandings(finalStandings);

         if (finalStandings.length > 0 && finalStandings[0].points !== '0') {
           setTimeout(() => {
             confetti({
               particleCount: 60,
               spread: 50,
               origin: { y: 0.5 },
               colors: ['#FFD700', '#FDE047', '#FFFFFF'],
               disableForReducedMotion: true,
             });
           }, 800);
         }
       } catch (error) {
         console.error(error);
       }
       setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getFormColor = (f: 'W'|'L'|'D') => {
    if (f === 'W') return '#22c55e';
    if (f === 'L') return '#ef4444';
    return '#52525b';
  }

  if (loading) return <div className="p-4" style={{ color: "var(--text-secondary)" }}>Loading Leaderboard Data...</div>;

  if (standings.length === 0) {
    return (
      <div className={styles.container}>
         <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h1>Elite Pavillion</h1>
            </div>
         </header>
         <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            <h2>Leaderboard is Empty</h2>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Go to the Arena tab to add players and score your first match!</p>
         </div>
      </div>
    );
  }

  const handleWhatsAppShare = async () => {
    if (!containerRef.current) return;
    
    try {
      setIsSharing(true);
      await new Promise(r => setTimeout(r, 100));

      const blob = await toBlob(containerRef.current, {
        cacheBust: true,
        style: { background: 'var(--bg-dark)' },
      });

      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], 'SkyHigh_Leaderboard.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file] // Strictly pass ONLY the file to prevent WhatsApp from dropping the image in favor of text
        });
      } else {
        // Fallback: forcefully download the image for desktop or unsupported browsers
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SkyHigh_Leaderboard.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Failsafe Download
      const error = err as any;
      if (error?.name !== 'AbortError') {
        alert("Capture failed. If an avatar blocked the screenshot, please refresh and try again. Error: " + (error?.message || "CORS/Format Issue"));
      }
    } finally {
      setIsSharing(false);
    }
  };

  // podium[0] = Rank 2, podium[1] = Rank 1, podium[2] = Rank 3
  const podium = [standings[1], standings[0], standings[2]]; 
  const rest = standings.length > 3 ? standings.slice(3) : [];

  return (
    <div className={styles.container} ref={containerRef} style={{ position: 'relative' }}>
      
      {/* Visual Overlay to tell user sharing is in progress */}
      {isSharing && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#EAB308', fontWeight: 'bold' }}>Capturing Leaderboard...</span>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.hamburger}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
          <h1>Elite Pavillion</h1>
        </div>
        <div className={styles.headerRight}>
          <Share2 size={24} className={styles.bellIcon} onClick={handleWhatsAppShare} style={{ marginRight: '1rem', cursor: 'pointer' }} />
          <div className={styles.bellWrapper}>
            <Bell size={24} className={styles.bellIcon} />
            <span className={styles.notificationBadge}></span>
          </div>
        </div>
      </header>

      <section className={styles.podiumSection}>
         <div className={styles.podiumContainer}>
            {/* Rank 2 */}
            {podium[0] && (
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
            )}

            {/* Rank 1 */}
            {podium[1] && (
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
            )}

            {/* Rank 3 */}
            {podium[2] && (
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
            )}
         </div>
      </section>

      {rest.length > 0 && (
        <>
          <div className={styles.sectionEyebrow}>FULL STANDINGS</div>
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
                        {(player.form || []).map((f: 'W' | 'L' | 'D', i: number) => (
                          <span key={i} className={styles.dot} style={{ backgroundColor: getFormColor(f) }}></span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.rowPoints}>{player.points}</div>
               </motion.div>
             ))}
          </section>
        </>
      )}
    </div>
  );
};
