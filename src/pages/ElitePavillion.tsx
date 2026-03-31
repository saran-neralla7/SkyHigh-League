import React, { useState, useEffect } from 'react';
import styles from './ElitePavillion.module.css';
import { Bell, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toBlob } from 'html-to-image';
import { getPlayers } from '../lib/db';
import type { Player } from '../lib/db';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%233f3f46'/%3E%3Ccircle cx='75' cy='55' r='25' fill='%23a1a1aa'/%3E%3Cpath d='M25 130 Q75 80 125 130 Z' fill='%23a1a1aa'/%3E%3C/svg%3E`;
const CROWN_ICON = `data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EAB308' stroke='%23EAB308' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 1l3 11h14l3-11-6 8-4-8-4 8z'/%3E%3Cpath d='M4 14h16v4H4z'/%3E%3C/svg%3E`;

export const ElitePavillion: React.FC = () => {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const shareCardRef = React.useRef<HTMLDivElement>(null);

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
               avatar: p.profileImage?.includes('pravatar') || !p.profileImage || p.profileImage.includes('default-avatar') ? DEFAULT_AVATAR : p.profileImage,
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
    if (!shareCardRef.current) return;
    
    try {
      setIsSharing(true);
      await new Promise(r => setTimeout(r, 100));

      // Render hidden card to blob
      const blob = await toBlob(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High-quality rendering
        style: { background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)' },
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader" style={{ marginBottom: '20px' }}></div>
          <span style={{ color: '#EAB308', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>Building High-Res Image...</span>
        </div>
      )}

      {/* Hidden Landscape Share Card (Fixed in background to prevent Safari culling) */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1000, pointerEvents: 'none' }}>
        <div 
          ref={shareCardRef}
          style={{
            width: '1200px',
            height: '630px',
          background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '50px 0',
          fontFamily: '"Inter", sans-serif',
          color: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '60px' }}>
          <div style={{ width: '60px', height: '60px', background: '#EAB308', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🏏</div>
          <h1 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-1.5px', margin: 0, color: '#FFFFFF', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>SKYHIGH LEAGUE</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '50px', width: '100%', height: '350px' }}>
          {/* Rank 2 */}
          {podium[0] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
               <img src={podium[0].avatar} style={{ width: '130px', height: '130px', borderRadius: '50%', border: '5px solid #C0C0C0', marginBottom: '20px', objectFit: 'cover', background: '#3f3f46' }} crossOrigin="anonymous" />
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', width: '100%', textAlign: 'center', borderTop: '8px solid #C0C0C0', backdropFilter: 'blur(10px)' }}>
                 <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[0].name}</p>
                 <p style={{ margin: '10px 0 0 0', fontSize: '42px', fontWeight: 900, color: '#FFFFFF' }}>{podium[0].points}</p>
                 <span style={{ background: '#C0C0C0', color: '#000', padding: '6px 16px', borderRadius: '20px', fontSize: '18px', fontWeight: 800, marginTop: '20px', display: 'inline-block' }}>RANK 2</span>
               </div>
            </div>
          )}

          {/* Rank 1 */}
          {podium[1] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '340px', transform: 'translateY(-40px)' }}>
               <div style={{ position: 'relative' }}>
                 <img src={CROWN_ICON} style={{ position: 'absolute', top: '-45px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', zIndex: 10 }} />
                 <img src={podium[1].avatar} style={{ width: '180px', height: '180px', borderRadius: '50%', border: '8px solid #EAB308', marginBottom: '25px', objectFit: 'cover', background: '#3f3f46' }} crossOrigin="anonymous" />
               </div>
               <div style={{ background: 'rgba(234,179,8,0.1)', padding: '30px', borderRadius: '24px', width: '100%', textAlign: 'center', borderTop: '10px solid #EAB308', boxShadow: '0 0 50px rgba(234,179,8,0.2)' }}>
                 <p style={{ margin: 0, fontSize: '36px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[1].name}</p>
                 <p style={{ margin: '10px 0 0 0', fontSize: '64px', fontWeight: 900, color: '#EAB308', textShadow: '0 0 20px rgba(234,179,8,0.5)' }}>{podium[1].points}</p>
                 <span style={{ background: 'linear-gradient(90deg, #EAB308, #FDE047)', color: '#000', padding: '8px 24px', borderRadius: '20px', fontSize: '22px', fontWeight: 900, marginTop: '20px', display: 'inline-block', boxShadow: '0 4px 15px rgba(234,179,8,0.4)' }}>CHAMPION</span>
               </div>
            </div>
          )}

          {/* Rank 3 */}
          {podium[2] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
               <img src={podium[2].avatar} style={{ width: '130px', height: '130px', borderRadius: '50%', border: '5px solid #CD7F32', marginBottom: '20px', objectFit: 'cover', background: '#3f3f46' }} crossOrigin="anonymous" />
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', width: '100%', textAlign: 'center', borderTop: '8px solid #CD7F32', backdropFilter: 'blur(10px)' }}>
                 <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[2].name}</p>
                 <p style={{ margin: '10px 0 0 0', fontSize: '42px', fontWeight: 900, color: '#FFFFFF' }}>{podium[2].points}</p>
                 <span style={{ background: '#CD7F32', color: '#000', padding: '6px 16px', borderRadius: '20px', fontSize: '18px', fontWeight: 800, marginTop: '20px', display: 'inline-block' }}>RANK 3</span>
               </div>
            </div>
          )}
        </div>
      </div>
      </div>

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
