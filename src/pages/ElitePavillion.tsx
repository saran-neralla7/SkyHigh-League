import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ElitePavillion.module.css';
import { Bell, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toBlob } from 'html-to-image';
import { getPlayers, getActiveSeasonId } from '../lib/db';
import type { Player } from '../lib/db';
import { WhatsAppGraphic } from '../components/WhatsAppGraphic';
import { sounds } from '../lib/sounds';

const CROWN_ICON = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0VBQjMwOCIgc3Ryb2tlPSIjRUFCMzA4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgMWwzIDExaDE0bDMtMTEtNiA4LTQtOC00IDh6Ii8+PHBhdGggZD0iTTQgMTRoMTZ2NEg0eiIvPjwvc3ZnPg==`;

export const ElitePavillion: React.FC = () => {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [season, setSeason] = useState('season-1');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
       try {
         const dbPlayers = await getPlayers();
         const dbSeason = await getActiveSeasonId();
         setSeason(dbSeason);
         
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
               avatar: p.profileImage || "/default-avatar.svg",
               movement: 0,
               form: p.metrics.form || []
            }
         });
         
         setStandings(finalStandings);

         if (dbPlayers.length > 0) {
           const topPoints = dbPlayers[0].metrics.totalPoints;
           setTimeout(() => {
             if (topPoints >= 300) {
               // Diamond / Elite Explosion
               sounds.playSuccess();
               confetti({
                 particleCount: 150,
                 spread: 80,
                 origin: { y: 0.5 },
                 colors: ['#FFD700', '#FFFFFF', '#67E8F9', '#FDE047'], // Gold + Diamonds
                 disableForReducedMotion: true,
               });
             } else if (topPoints === 0) {
               // Sad Gray Rain
               confetti({
                 particleCount: 30,
                 spread: 100,
                 origin: { y: 0 },
                 colors: ['#52525b', '#71717a', '#3f3f46'],
                 shapes: ['square'],
                 ticks: 300,
                 gravity: 0.5,
                 disableForReducedMotion: true,
               });
             } else {
               // Normal Celebration
               confetti({
                 particleCount: 60,
                 spread: 50,
                 origin: { y: 0.5 },
                 colors: ['#FFD700', '#FDE047', '#FFFFFF'],
                 disableForReducedMotion: true,
               });
             }
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
    const captureNode = document.getElementById("whatsapp-capture-node");
    if (!captureNode) {
       console.error("Screenshot Canvas Missing");
       return;
    }
    
    try {
      setIsSharing(true);
      // Wait a moment for the overlay to render
      await new Promise(r => setTimeout(r, 100));

      // Forcefully bring the node into the viewport underneath the loading overlay
      captureNode.style.left = '0px';
      captureNode.style.zIndex = '9998';

      // We need to wait a frame for the CSS reflow to occur before capturing
      await new Promise(r => setTimeout(r, 50));

      const blob = await toBlob(captureNode, {
        cacheBust: true,
        pixelRatio: 2, // High-quality 2x rendering of the 1080px node!
        style: { background: '#09090b' },
        filter: (node) => {
          if (node.id === 'capture-overlay') return false;
          return true;
        }
      });

      // Shove it back off-screen
      captureNode.style.left = '-9999px';
      captureNode.style.zIndex = '-100';

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
        <div id="capture-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader" style={{ marginBottom: '20px' }}></div>
          <span style={{ color: '#EAB308', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>Building High-Res Image...</span>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.hamburger}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1>Elite Pavillion</h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginTop: '0.1rem' }}>{season.toUpperCase()}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div onClick={() => navigate('/hall-of-fame')} style={{ cursor: 'pointer', marginRight: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>🏆 HoF</div>
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
                 onClick={() => navigate('/profile/' + podium[0].id)}
                 style={{ cursor: 'pointer' }}
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
                 onClick={() => navigate('/profile/' + podium[1].id)}
                 style={{ cursor: 'pointer', zIndex: 10 }}
              >
                 <div className={styles.avatarWrapperRank1}>
                   <div className={styles.haloEffect}></div>
                   <img src={podium[1].avatar} alt={podium[1].name} className={styles.podiumAvatarRank1} />
                   <div className={styles.badge1}>
                     <img src={CROWN_ICON} alt="Rank 1" className={styles.crownIconBadge} />
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
                 onClick={() => navigate('/profile/' + podium[2].id)}
                 style={{ cursor: 'pointer' }}
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
                  onClick={() => navigate('/profile/' + player.id)}
                  style={{ cursor: 'pointer' }}
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
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginRight: '6px' }}>{player.points} PTS</span>
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
      
      {/* Off-Screen Target for Flawless Resolution WhatsApp Snapshots */}
      <WhatsAppGraphic standings={standings} season={season} />
    </div>
  );
};
