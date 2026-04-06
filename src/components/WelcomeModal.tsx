import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { getPlayers } from '../lib/db';
import styles from './WelcomeModal.module.css';
import { Sparkles, Trophy, X, Activity, Target } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const WelcomeModal: React.FC = () => {
  const { currentUser, playerData, isAdmin, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rank: 0, points: 0, form: [] as string[] });
  const [aiText, setAiText] = useState('');
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    if (authLoading) return;

    const hasSeen = sessionStorage.getItem('welcome_seen');
    if (hasSeen || !currentUser) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        if (playerData) {
          const allPlayers = await getPlayers();
          const pIndex = allPlayers.findIndex(p => p.id === playerData.id);
          const pData = allPlayers[pIndex];

          if (pData) {
            const currentRank = pIndex + 1;
            
            const eSnap = await getDocs(collection(db, 'entries'));
            const pEntries = eSnap.docs.map(d => d.data()).filter(e => e.playerId === pData.id);
            const dynamicRawScore = pEntries.reduce((sum, e) => sum + e.score, 0);

            const pts = dynamicRawScore || 0;
            const form = pData.metrics.form || [];
            
            setStats({ rank: currentRank, points: pts, form });
            setAiText(generateSarcasm(currentRank, form));
          } else {
            setAiText("You don't even have a player profile yet. Typical.");
          }
        } else {
          if (isAdmin || currentUser?.email?.toLowerCase().includes('admin')) {
             setAiText("Welcome back Admin. Who are you going to ban today?");
          } else {
             setAiText("You don't have a linked player profile yet! Ask the Admin to map your email to your squad name.");
          }
        }
        
        setIsOpen(true);
        sessionStorage.setItem('welcome_seen', 'true');
      } catch (e) {
        console.error("Error loading welcome modal stats", e);
      }
      setLoading(false);
    };

    init();
  }, [currentUser, playerData, authLoading]);

  const generateSarcasm = (rank: number, form: string[]) => {
    if (form.length === 0) return "Welcome rookie! Ready to inevitably disappoint your squad?";
    if (rank === 1) return "Top of the leaderboard... enjoy the view before gravity (and your lack of skill) brings you back down.";
    
    const wins = form.filter(f => f === 'W').length;
    const wr = form.length > 0 ? wins / form.length : 0;

    if (wr >= 0.8) return "Look at you, MVP material! Or maybe everyone else is just terrible today.";
    if (wr <= 0.2) return "A truly consistent performance. Consistently awful, but consistent nonetheless!";
    
    return "Ah, the rollercoaster of mediocrity. Try focusing on the game instead of the snacks.";
  };

  const getFormColor = (f: string) => {
    if (f === 'W') return '#22c55e';
    if (f === 'L') return '#ef4444';
    return '#52525b';
  };

  if (loading || !isOpen) return null;

  const username = playerData?.name || (currentUser?.email?.split('@')[0]) || 'User';

  return (
    <AnimatePresence>
      <div className={styles.overlay}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={styles.modal}
        >
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>

          <h2 className={styles.greeting}>{greeting}, <span>{username}</span></h2>
          
          <div className={styles.divider}></div>

          {playerData ? (
            <div className={styles.statsWrapper}>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <Trophy size={20} color="#EAB308" className={styles.icon} />
                  <span className={styles.statValue}>#{stats.rank}</span>
                  <span className={styles.statLabel}>Current Rank</span>
                </div>
                <div className={styles.statBox}>
                  <Target size={20} color="#3b82f6" className={styles.icon} />
                  <span className={styles.statValue}>{stats.points}</span>
                  <span className={styles.statLabel}>Raw Points</span>
                </div>
              </div>
              
              <div className={styles.formBox}>
                <div className={styles.formHeader}>
                  <Activity size={18} color="#a1a1aa" />
                  <span className={styles.statLabel}>Last 5 Matches</span>
                </div>
                <div className={styles.formDots}>
                  {stats.form.length > 0 ? stats.form.map((f, i) => (
                    <span key={i} className={styles.dot} style={{ background: getFormColor(f) }}></span>
                  )) : <span className={styles.noMatches}>No matches yet</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.adminFallback}>
               Enjoy orchestrating the chaos.
            </div>
          )}

          <div className={styles.aiBox}>
            <div className={styles.aiHeader}>
              <Sparkles size={16} color="#c084fc" />
              <span>AI Analysis</span>
            </div>
            <p className={styles.aiText}>"{aiText}"</p>
          </div>

          <button className={styles.primaryBtn} onClick={() => setIsOpen(false)}>
            Let's Go!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
