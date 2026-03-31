import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Users, BarChart3, ShieldAlert, Clock } from 'lucide-react';
import styles from './BottomNav.module.css';
import { useAuth } from '../AuthContext';

export const BottomNav: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <Trophy className={styles.icon} />
             <span className={styles.label}>ELITE</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/squad" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <Users className={styles.icon} />
             <span className={styles.label}>SQUAD</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <Clock className={styles.icon} />
             <span className={styles.label}>HISTORY</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/stats" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
             <BarChart3 className={styles.icon} />
             <span className={styles.label}>STATS</span>
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink to="/admin" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
               <ShieldAlert className={styles.icon} />
               <span className={styles.label}>ADMIN</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
};
