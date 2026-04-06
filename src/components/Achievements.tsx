import React from 'react';
import { motion } from 'framer-motion';
import type { Achievement } from '../lib/db';
import styles from './Achievements.module.css';

interface AchievementsProps {
  achievements: Achievement[];
}

export const Achievements: React.FC<AchievementsProps> = ({ achievements }) => {
  return (
    <div className={styles.achievementsContainer}>
      <h3 className={styles.title}>Trophy Cabinet</h3>
      <div className={styles.grid}>
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            className={`${styles.badge} ${a.earned ? styles.earned : styles.locked}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={styles.icon}>{a.icon}</div>
            <div className={styles.name}>{a.name}</div>
            <div className={styles.desc}>{a.description}</div>
            {a.earned && <div className={styles.earnedLabel}>UNLOCKED</div>}
            {!a.earned && <div className={styles.lockedLabel}>LOCKED</div>}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
