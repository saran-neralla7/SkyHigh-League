import React from 'react';
import { NavLink } from 'react-router-dom';
import { Swords, Users, BarChart3, ShieldAlert } from 'lucide-react';
import styles from './BottomNav.module.css';

export const BottomNav: React.FC = () => {
  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <Swords className={styles.icon} />
             <span className={styles.label}>ARENA</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <Users className={styles.icon} />
             <span className={styles.label}>SQUAD</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/stats" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <BarChart3 className={styles.icon} />
             <span className={styles.label}>STATS</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <ShieldAlert className={styles.icon} />
             <span className={styles.label}>ELITE</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
