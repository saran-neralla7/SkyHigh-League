import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Login } from './Login';
import styles from './AdminScoring.module.css';
import { Crown, CheckCircle2 } from 'lucide-react';
import { getPlayers } from '../lib/db';
import type { Player } from '../lib/db';

export const AdminScoring: React.FC = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchNumber, setMatchNumber] = useState('13');
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAdmin) {
       // Mock players for now, we will hook to DB later or use DB if populated
       const fetchMockPlayers = async () => {
         try {
           const dbPlayers = await getPlayers();
           if (dbPlayers.length > 0) {
             setPlayers(dbPlayers);
           } else {
             // Fallback to mock UI data matching design
             setPlayers([
               { id: '1', name: 'Virat Kohli', team: 'ROYAL CHALLENGERS', profileImage: 'https://i.pravatar.cc/150?u=virat', metrics: {wins:0, top3:0, average:0, totalPoints:0} },
               { id: '2', name: 'Rohit Sharma', team: 'MUMBAI INDIANS', profileImage: 'https://i.pravatar.cc/150?u=rohit', metrics: {wins:0, top3:0, average:0, totalPoints:0} },
               { id: '3', name: 'Smriti Mandhana', team: 'ROYAL CHALLENGERS', profileImage: 'https://i.pravatar.cc/150?u=smriti', metrics: {wins:0, top3:0, average:0, totalPoints:0} },
               { id: '4', name: 'KL Rahul', team: 'LUCKNOW SUPER GIANTS', profileImage: 'https://i.pravatar.cc/150?u=kl', metrics: {wins:0, top3:0, average:0, totalPoints:0} },
             ]);
           }
         } catch(e) { console.error(e) }
         setLoading(false);
       };
       fetchMockPlayers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Login />;
  }

  const handleScoreChange = (id: string, val: string) => {
    // allow only numbers and decimal
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async () => {
     // Core Logic Requirements:
     // - Auto sort scores descending
     // - Tie-breaker: Higher previous total points wins
     // - If still equal -> assign same rank
     // - Assign Points: Rank 1 -> 50, Rank 2 -> 30, Rank 3 -> 10, Others -> 0

     // Map players with their inputted score
     const playerScores = players.map(p => {
       const scoreVal = parseFloat(scores[p.id]) || 0;
       return { player: p, score: scoreVal, prevPoints: p.metrics.totalPoints };
     });

     // Sort
     playerScores.sort((a, b) => {
       if (b.score !== a.score) return b.score - a.score;
       // Tie-Breaker
       return b.prevPoints - a.prevPoints;
     });

     // Assign Ranks and Points
     let currentRank = 1;
     const results = playerScores.map((item, index) => {
       if (index > 0) {
         const prevItem = playerScores[index - 1];
         // Only increment rank if strictly worse in score or tie-breaker
         if (item.score < prevItem.score || (item.score === prevItem.score && item.prevPoints < prevItem.prevPoints)) {
           currentRank = index + 1;
         }
       }
       
       let pts = 0;
       if (currentRank === 1) pts = 50;
       else if (currentRank === 2) pts = 30;
       else if (currentRank === 3) pts = 10;

       return {
         playerId: item.player.id,
         name: item.player.name,
         score: item.score,
         rank: currentRank,
         pointsAwarded: pts
       };
     });

     console.log("Saving scores for match", matchNumber, results);
     alert("Match Saved! Scores calculated and ranked.");
  }

  if (loading) return <div className="p-4">Loading UI...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.hamburger}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
          <h1>MATCH SCORING</h1>
        </div>
        <div className={styles.headerRight}>
          <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className={styles.adminAvatar} />
        </div>
      </header>

      <section className={styles.identityGroup}>
        <div className={styles.identityCard}>
           <p className={styles.cardEyebrow}>IDENTITY & SEQUENCE</p>
           <label>Match Number</label>
           <div className={styles.matchNumberInputWrapper}>
             <input 
                type="number" 
                value={matchNumber} 
                onChange={(e) => setMatchNumber(e.target.value)} 
                className={styles.matchNumberInput}
             />
             <div className={styles.crownIcon}>
               <Crown size={20} color="#EAB308" />
             </div>
           </div>
        </div>
      </section>

      <section className={styles.performanceSection}>
         <div className={styles.sectionHeader}>
           <h2>Player Performance</h2>
           <span className={styles.activeCount}>{players.length} PLAYERS ACTIVE</span>
         </div>
         
         <div className={styles.playerList}>
           {players.map(player => (
             <div key={player.id} className={styles.playerCard}>
                <div className={styles.playerInfo}>
                   <div className={styles.avatarWrapper}>
                     <img src={player.profileImage} alt={player.name} className={styles.avatar} />
                     {player.id === '1' && <CheckCircle2 size={14} className={styles.verifiedIcon} />}
                   </div>
                   <div className={styles.nameDetails}>
                     <h3>{player.name}</h3>
                     <p>{player.team}</p>
                   </div>
                </div>
                <div className={styles.scoreInputWrapper}>
                  <input 
                    type="number" 
                    placeholder="Pts" 
                    value={scores[player.id] || ''}
                    onChange={(e) => handleScoreChange(player.id, e.target.value)}
                    className={styles.scoreInput} 
                  />
                </div>
             </div>
           ))}
         </div>
      </section>

      <button className={styles.submitBtn} onClick={handleSubmit}>
         SAVE MATCH RESULTS
      </button>
    </div>
  );
};
