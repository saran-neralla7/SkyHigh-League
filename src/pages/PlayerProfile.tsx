import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import styles from './PlayerProfile.module.css';

export const PlayerProfile: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ArrowLeft size={24} color="#FFD700" onClick={() => navigate(-1)} className={styles.iconBtn} />
        <span className={styles.headerTitle}>PLAYER PROFILE</span>
        <Share2 size={24} color="#FFD700" className={styles.iconBtn} />
      </header>
      
      <section className={styles.profileSection}>
         <div className={styles.avatarWrapper}>
            <img src="https://i.pravatar.cc/150?u=arjun" alt="Arjun Mehta" className={styles.mainAvatar} />
            <div className={styles.proBadge}>PRO</div>
         </div>
         <h1 className={styles.playerName}>Arjun Mehta</h1>
         <p className={styles.playerTitle}>ELITE STRATEGIST • RANK #124</p>
      </section>

      <div className={styles.statsGrid}>
         <div className={styles.statCard}>
           <span className={styles.statValueHighlight}>2,855</span>
           <span className={styles.statLabel}>TOTAL PTS</span>
         </div>
         <div className={styles.statCard}>
           <span className={styles.statValueGreen}>4</span>
           <span className={styles.statLabel}>WINS</span>
         </div>
         <div className={styles.statCard}>
           <span className={styles.statValue}>8</span>
           <span className={styles.statLabel}>TOP 3</span>
         </div>
         <div className={styles.statCard}>
           <span className={styles.statValue}>237.9</span>
           <span className={styles.statLabel}>AVERAGE</span>
         </div>
      </div>

      <div className={styles.historyHeader}>
        <h2>MATCH HISTORY</h2>
        <span className={styles.viewAllBtn}>VIEW ALL</span>
      </div>

      <div className={styles.historyList}>
         
         <div className={styles.historyRow}>
            <div className={styles.matchInfoStack}>
              <span className={styles.matchId}>MATCH 12</span>
              <span className={styles.matchDate}>Oct 24, 2023</span>
            </div>
            <div className={styles.rankCenter}>
               <div className={styles.rankBadgeGold}>1st</div>
               <span className={styles.rankStatusGold}>CHAMPION</span>
            </div>
            <div className={styles.pointsRight}>
               <span className={styles.ptsValueGreen}>+50 <span className={styles.ptsLabel}>PTS</span></span>
               <span className={styles.earnings}>EARNINGS: 5,000</span>
            </div>
         </div>

         <div className={styles.historyRow}>
            <div className={styles.matchInfoStack}>
              <span className={styles.matchId}>MATCH 11</span>
              <span className={styles.matchDate}>Oct 22, 2023</span>
            </div>
            <div className={styles.rankCenter}>
               <div className={styles.rankBadgeSilver}>4th</div>
               <span className={styles.rankStatusSilver}>QUALIFIER</span>
            </div>
            <div className={styles.pointsRight}>
               <span className={styles.ptsValue}>+0 <span className={styles.ptsLabel}>PTS</span></span>
               <span className={styles.earnings}>EARNINGS: 250</span>
            </div>
         </div>

      </div>

    </div>
  );
};
