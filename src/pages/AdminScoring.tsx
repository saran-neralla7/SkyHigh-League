import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Login } from './Login';
import styles from './AdminScoring.module.css';
import { Crown, CheckCircle2, UserPlus, Loader2 } from 'lucide-react';
import { getPlayers, addPlayer, saveMatchResults } from '../lib/db';
import type { Player } from '../lib/db';

export const AdminScoring: React.FC = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchNumber, setMatchNumber] = useState('1');
  const [scores, setScores] = useState<Record<string, string>>({});
  
  // Add Player State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('');
  const [isAddingData, setIsAddingData] = useState(false);

  useEffect(() => {
    if (isAdmin) {
       const fetchMockPlayers = async () => {
         try {
           const dbPlayers = await getPlayers();
           setPlayers(dbPlayers);
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

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    setIsAddingData(true);
    try {
      const newP = await addPlayer(newPlayerName, newPlayerTeam);
      setPlayers(prev => [...prev, newP]);
      setNewPlayerName('');
      setNewPlayerTeam('');
    } catch(e) {
      console.error(e);
      alert("Failed to add player.");
    }
    setIsAddingData(false);
  };

  const handleSubmit = async () => {
     if (players.length === 0) return alert("No players added.");
     
     setIsAddingData(true);
     // Map players with their inputted score
     const playerScores = players.map(p => {
       const scoreVal = parseFloat(scores[p.id]) || 0;
       return { player: p, score: scoreVal, prevPoints: p.metrics.totalPoints };
     });

     // Sort
     playerScores.sort((a, b) => {
       if (b.score !== a.score) return b.score - a.score;
       return b.prevPoints - a.prevPoints;
     });

     // Assign Ranks and Points
     let currentRank = 1;
     const results = playerScores.map((item, index) => {
       if (index > 0) {
         const prevItem = playerScores[index - 1];
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
         pointsAwarded: pts,
         prevPoints: item.prevPoints
       };
     });

     try {
       await saveMatchResults(Number(matchNumber), results, players);
       alert("Match Saved successfully via Firestore!");
       setScores({});
       setMatchNumber(String(Number(matchNumber) + 1));
       const freshPlayers = await getPlayers();
       setPlayers(freshPlayers);
     } catch (err) {
       console.error(err);
       alert("Upload failed. Ensure Firebase is connected and rules are set.");
     }
     setIsAddingData(false);
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
           <p className={styles.cardEyebrow}>MATCH DATA</p>
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

        <div className={styles.identityCard} style={{ marginTop: '1rem' }}>
           <p className={styles.cardEyebrow}>ADD NEW PLAYER</p>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
             <input 
                type="text" 
                placeholder="Player Name" 
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className={styles.matchNumberInput}
                style={{ padding: '0.75rem', fontSize: '0.875rem' }}
             />
             <div style={{ display: 'flex', gap: '0.5rem' }}>
               <input 
                  type="text" 
                  placeholder="Team Alias (Optional)" 
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                  className={styles.matchNumberInput}
                  style={{ padding: '0.75rem', fontSize: '0.875rem', flex: 1 }}
               />
               <button 
                  onClick={handleAddPlayer} 
                  disabled={isAddingData}
                  style={{ background: 'var(--accent-primary)', color: '#000', padding: '0 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  <UserPlus size={18} />
               </button>
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

      <button className={styles.submitBtn} onClick={handleSubmit} disabled={isAddingData}>
         {isAddingData ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 size={18} strokeWidth={2.5} style={{ animation: 'spin 1.5s linear infinite' }} /> PROCESSING...</span> : 'SAVE MATCH RESULTS'}
      </button>
    </div>
  );
};
