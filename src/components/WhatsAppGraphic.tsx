import React from 'react';
import styles from './WhatsAppGraphic.module.css';
import { Trophy } from 'lucide-react';

export const WhatsAppGraphic: React.FC<{ standings: any[], season: string }> = ({ standings, season }) => {
  const top3 = standings.slice(0, 3);
  const remaining = standings.slice(3);

  // Guarantee order: 2, 1, 3 for podium
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className={styles.canvasContainer} id="whatsapp-capture-node">
      <div className={styles.background}></div>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Trophy size={48} color="#FFD700" />
          <div>
            <h1>SKYHIGH LEAGUE</h1>
            <p>OFFICIAL MATCH LEADERBOARD • {season.toUpperCase()}</p>
          </div>
        </div>
      </header>

      <div className={styles.podiumSection}>
        {podiumOrder.map((player) => {
          if (!player) return null;
          const isWinner = player.rank === 1;
          return (
            <div key={player.id} className={`${styles.podiumBlock} ${isWinner ? styles.winnerBlock : ''}`}>
              <div className={styles.avatarWrapper}>
                <img src={player.avatar} alt={player.name} crossOrigin="anonymous" />
                {isWinner && <div className={styles.crown}>👑</div>}
                <div className={`${styles.rankBadge} ${isWinner ? styles.goldBadge : ''}`}>{player.rank}</div>
              </div>
              <h2 className={styles.playerName}>{player.name}</h2>
              <div className={styles.pointsBadge}>{player.points} PTS</div>
            </div>
          );
        })}
      </div>

      <div className={styles.listSection}>
        {remaining.map((player) => (
          <div key={player.id} className={styles.listRow}>
             <div className={styles.listLeft}>
                <span className={styles.listRank}>{player.rank}</span>
                <img src={player.avatar} className={styles.listAvatar} crossOrigin="anonymous"/>
                <span className={styles.listName}>{player.name}</span>
             </div>
             <div className={styles.listPoints}>{player.points} PTS</div>
          </div>
        ))}
      </div>
      
      <div className={styles.footer}>
         <span>Generated Automatically by SkyHigh App</span>
      </div>
    </div>
  );
};
