import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Player } from '../lib/db';
import { TeamBadge } from './TeamBadge';
import { Trophy, TrendingUp } from 'lucide-react';
import styles from './TradingCard.module.css';
import { sounds } from '../lib/sounds';
import { useNavigate } from 'react-router-dom';

interface TradingCardProps {
  player: Player;
  rank: number;
  index: number;
}

export const TradingCard: React.FC<TradingCardProps> = ({ player, rank, index }) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  // Motion Values for mouse position tracking
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Smooth springs for physics
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  // Map mouse position to 3D rotation
  const rotateX = useTransform(mouseYSpring, [0, 1], [15, -15]);
  const rotateY = useTransform(mouseXSpring, [0, 1], [-15, 15]);

  // Foil Glare gradient movement based on tilt
  const glareX = useTransform(mouseXSpring, [0, 1], [-100, 100]);
  const glareY = useTransform(mouseYSpring, [0, 1], [-100, 100]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    x.set(mouseX / rect.width);
    y.set(mouseY / rect.height);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    x.set(0.5);
    y.set(0.5);
  };

  const handleClick = () => {
    sounds.playSwoosh();
    navigate(`/profile/${player.id}`);
  };

  const isPodium = rank <= 3;

  return (
    <motion.div
      ref={cardRef}
      className={styles.cardContainer}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseEnter={() => {
        setHovering(true);
        sounds.playHover();
      }}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
      style={{
        zIndex: hovering ? 10 : 1
      }}
    >
      <motion.div
        className={`${styles.cardInner} ${isPodium ? styles.cardInnerGold : ''}`}
        style={{
          rotateX,
          rotateY,
          scale: hovering ? 1.05 : 1,
        }}
      >
        {/* Holographic foil glare overlay */}
        <motion.div 
          className={`${styles.glare} ${isPodium ? styles.goldenGlare : ''}`}
          style={{
            x: glareX,
            y: glareY,
            opacity: hovering ? 0.8 : 0,
          }}
        />

        <div className={styles.playerLeft}>
          <span className={`${styles.playerRank} ${isPodium ? styles.rankGold : ''}`}>
            {rank}
          </span>
          <img src={player.profileImage} alt={player.name} className={styles.playerAvatar} />
          <div className={styles.playerDetails}>
            <h3>{player.name}</h3>
            <div style={{ marginTop: '0.25rem' }}><TeamBadge team={player.team} /></div>
          </div>
        </div>

        <div className={styles.playerRight}>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Trophy size={12} color="#FFD700" />
              <span>{player.metrics.wins}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <TrendingUp size={12} color="#22c55e" />
              <span>{player.metrics.top3}</span>
            </div>
          </div>
          <span className={styles.playerPts}>{player.metrics.totalPoints} PTS</span>
          
          <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
            {(player.metrics.form || []).map((f, i) => (
              <span 
                key={i} 
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: f === 'W' ? '#22c55e' : f === 'L' ? '#ef4444' : '#52525b'
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
