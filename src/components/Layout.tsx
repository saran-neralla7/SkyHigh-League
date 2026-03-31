import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Layout.module.css';
import { useAuth } from '../AuthContext';
import { Login } from '../pages/Login';
import { LogOut } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -10, scale: 1.02 }
};

const pageTransition: any = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className={styles.appContainer}>
      <button 
        onClick={() => { logout(); navigate('/'); }}
        className={styles.logoutBtn}
        aria-label="Logout"
      >
        <LogOut size={18} />
      </button>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className={styles.mainContent}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
};
