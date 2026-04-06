import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers } from '../lib/db';
import type { Player } from '../lib/db';
import { ArrowLeft, Swords } from 'lucide-react';
import styles from './HeadToHead.module.css';
import { motion } from 'framer-motion';

export const HeadToHead: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');

  useEffect(() => {
    getPlayers().then(p => setPlayers(p));
  }, []);

  // Set default players if available
  useEffect(() => {
    if (players.length >= 2 && !player1Id && !player2Id) {
      setPlayer1Id(players[0].id);
      setPlayer2Id(players[1].id);
    }
  }, [players]);

  const p1 = players.find(p => p.id === player1Id);
  const p2 = players.find(p => p.id === player2Id);

  const getStatColor = (val1: number, val2: number, invert = false) => {
    if (val1 === val2) return 'var(--text-primary)';
    const p1Better = invert ? val1 < val2 : val1 > val2;
    return p1Better ? 'var(--accent-primary)' : 'var(--error)';
  };

  const getFillW = (val1: number, val2: number) => {
    if (val1 === 0 && val2 === 0) return 50;
    return (val1 / (val1 + val2)) * 100;
  };

  const renderStatBar = (label: string, v1: number, v2: number, suffix = '', invert = false) => {
    const p1color = getStatColor(v1, v2, invert);
    const p2color = getStatColor(v2, v1, invert);
    const fill1 = getFillW(v1, v2);
    
    return (
      <div className={styles.statRow}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValues}>
          <span style={{ color: p1color, fontWeight: 700 }}>{v1}{suffix}</span>
          <span style={{ color: p2color, fontWeight: 700 }}>{v2}{suffix}</span>
        </div>
        <div className={styles.barTrack}>
          <motion.div 
            className={styles.barFill1} 
            initial={{ width: '50%' }}
            animate={{ width: `${fill1}%`, backgroundColor: p1color }}
            transition={{ duration: 0.5, type: 'spring' }}
          />
          <motion.div 
            className={styles.barFill2} 
            initial={{ width: '50%' }}
            animate={{ width: `${100 - fill1}%`, backgroundColor: p2color }}
            transition={{ duration: 0.5, type: 'spring' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.titleWrapper}>
          <Swords size={20} className={styles.titleIcon} />
          <h1>Head-to-Head</h1>
        </div>
      </header>

      <div className={styles.selectorRow}>
        <select 
          className={styles.pSelect} 
          value={player1Id} 
          onChange={(e) => setPlayer1Id(e.target.value)}
        >
          {players.map(p => <option key={p.id} value={p.id} disabled={p.id === player2Id}>{p.name}</option>)}
        </select>
        <span className={styles.vs}>VS</span>
        <select 
          className={styles.pSelect} 
          value={player2Id} 
          onChange={(e) => setPlayer2Id(e.target.value)}
        >
          {players.map(p => <option key={p.id} value={p.id} disabled={p.id === player1Id}>{p.name}</option>)}
        </select>
      </div>

      {p1 && p2 && (
        <div className={styles.comparisonArena}>
          <div className={styles.avatarsRow}>
            <div className={styles.avatarHolder}>
              <img src={p1.profileImage} alt={p1.name} />
              <div className={styles.pName}>{p1.name}</div>
            </div>
            <div className={styles.avatarsVs}><Swords size={24}/></div>
            <div className={styles.avatarHolder}>
              <img src={p2.profileImage} alt={p2.name} />
              <div className={styles.pName}>{p2.name}</div>
            </div>
          </div>

          <div className={styles.statsContainer}>
            {renderStatBar('Total Points', p1.metrics.totalPoints, p2.metrics.totalPoints)}
            {renderStatBar('Match Wins', p1.metrics.wins, p2.metrics.wins)}
            {renderStatBar('Top 3 Finishes', p1.metrics.top3, p2.metrics.top3)}
            {renderStatBar('Average Pts', p1.metrics.average, p2.metrics.average)}
          </div>
        </div>
      )}
    </div>
  );
};
