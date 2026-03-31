import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Login } from './Login';
import styles from './AdminScoring.module.css';
import { Crown, Loader2, Mail, Lock } from 'lucide-react';
import { getPlayers, saveMatchResults } from '../lib/db';
import type { Player } from '../lib/db';

export const AdminScoring: React.FC = () => {
  const { isAdmin, createPlayerAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchNumber, setMatchNumber] = useState('1');
  const [matchTitle, setMatchTitle] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  
  // Add Player State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerPassword, setNewPlayerPassword] = useState('');
  const [isAddingData, setIsAddingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'scoring'|'players'>('scoring');

  useEffect(() => {
    if (isAdmin) {
       const fetchPlayers = async () => {
         try {
           const dbPlayers = await getPlayers();
           setPlayers(dbPlayers);
         } catch(e) { console.error(e) }
         setLoading(false);
       };
       fetchPlayers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Login />;
  }

  const handleScoreChange = (id: string, val: string) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const handleCreatePlayerAccount = async () => {
    if (!newPlayerName.trim() || !newPlayerEmail.trim() || !newPlayerPassword.trim()) {
      return alert("Please fill in Name, Email, and Password.");
    }
    if (newPlayerPassword.length < 6) {
      return alert("Password must be at least 6 characters.");
    }
    setIsAddingData(true);
    try {
      await createPlayerAccount(newPlayerEmail, newPlayerPassword, newPlayerName, newPlayerTeam);
      alert(`Account created for ${newPlayerName}!\nLogin: ${newPlayerEmail}`);
      setNewPlayerName('');
      setNewPlayerTeam('');
      setNewPlayerEmail('');
      setNewPlayerPassword('');
      // Refresh players list
      const freshPlayers = await getPlayers();
      setPlayers(freshPlayers);
    } catch(e: any) {
      console.error(e);
      alert("Failed: " + (e.message || "Unknown error"));
    }
    setIsAddingData(false);
  };

  const handleSubmit = async () => {
     if (players.length === 0) return alert("No players added.");
     
     setIsAddingData(true);
     const playerScores = players.map(p => {
       const scoreVal = parseFloat(scores[p.id]) || 0;
       return { player: p, score: scoreVal, prevPoints: p.metrics.totalPoints };
     });

     playerScores.sort((a, b) => {
       if (b.score !== a.score) return b.score - a.score;
       return b.prevPoints - a.prevPoints;
     });

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
       await saveMatchResults(Number(matchNumber), results, players, matchTitle);
       alert("Match Saved successfully via Firestore!");
       setScores({});
       setMatchNumber(String(Number(matchNumber) + 1));
       setMatchTitle('');
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
          <h1>ADMIN PANEL</h1>
        </div>
        <div className={styles.headerRight}>
          <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className={styles.adminAvatar} />
        </div>
      </header>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('scoring')}
          style={{ 
            flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.8rem',
            background: activeTab === 'scoring' ? 'var(--accent-primary)' : 'var(--bg-card)', 
            color: activeTab === 'scoring' ? '#000' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
          MATCH SCORING
        </button>
        <button 
          onClick={() => setActiveTab('players')}
          style={{ 
            flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.8rem',
            background: activeTab === 'players' ? 'var(--accent-primary)' : 'var(--bg-card)', 
            color: activeTab === 'players' ? '#000' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
          CREATE PLAYER
        </button>
      </div>

      {activeTab === 'scoring' && (
        <>
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
               <label style={{ marginTop: '0.75rem' }}>Match Title</label>
               <input
                  type="text"
                  placeholder="e.g. MI vs CSK"
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                  className={styles.matchNumberInput}
                  style={{ padding: '0.75rem', fontSize: '0.875rem', marginTop: '0.25rem' }}
               />
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
                       </div>
                       <div className={styles.nameDetails}>
                         <h3>{player.name}</h3>
                         <p>{player.team} • {player.metrics.totalPoints} PTS</p>
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
        </>
      )}

      {activeTab === 'players' && (
        <section className={styles.identityGroup}>
          <div className={styles.identityCard}>
             <p className={styles.cardEyebrow}>CREATE PLAYER ACCOUNT</p>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
               Create a login for your friend. They can sign in with the email & password you set here.
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <input 
                  type="text" 
                  placeholder="Player Name" 
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className={styles.matchNumberInput}
                  style={{ padding: '0.75rem', fontSize: '0.875rem' }}
               />
               <input 
                  type="text" 
                  placeholder="Team Alias (e.g. MUMBAI INDIANS)" 
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                  className={styles.matchNumberInput}
                  style={{ padding: '0.75rem', fontSize: '0.875rem' }}
               />
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                 <Mail size={16} color="var(--text-secondary)" />
                 <input 
                    type="email" 
                    placeholder="player@email.com" 
                    value={newPlayerEmail}
                    onChange={(e) => setNewPlayerEmail(e.target.value)}
                    className={styles.matchNumberInput}
                    style={{ padding: '0.75rem', fontSize: '0.875rem', flex: 1 }}
                 />
               </div>
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                 <Lock size={16} color="var(--text-secondary)" />
                 <input 
                    type="text" 
                    placeholder="Password (min 6 chars)" 
                    value={newPlayerPassword}
                    onChange={(e) => setNewPlayerPassword(e.target.value)}
                    className={styles.matchNumberInput}
                    style={{ padding: '0.75rem', fontSize: '0.875rem', flex: 1 }}
                 />
               </div>
               <button 
                  onClick={handleCreatePlayerAccount} 
                  disabled={isAddingData}
                  className={styles.submitBtn}
                  style={{ marginTop: '0.5rem' }}>
                  {isAddingData ? 'Creating...' : 'CREATE PLAYER ACCOUNT'}
               </button>
             </div>
          </div>

          {/* Existing Players List */}
          <div className={styles.identityCard} style={{ marginTop: '1rem' }}>
             <p className={styles.cardEyebrow}>REGISTERED PLAYERS ({players.length})</p>
             <div style={{ marginTop: '0.75rem' }}>
               {players.map(p => (
                 <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                   <img src={p.profileImage} alt={p.name} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                   <div>
                     <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</p>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.team} • {p.metrics.totalPoints} PTS</p>
                   </div>
                 </div>
               ))}
               {players.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No players yet. Create accounts above!</p>}
             </div>
          </div>
        </section>
      )}
    </div>
  );
};
