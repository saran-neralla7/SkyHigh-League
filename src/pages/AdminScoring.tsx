import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Login } from './Login';
import styles from './AdminScoring.module.css';
import { Crown, Loader2, Mail, Lock, Trash2, Trophy } from 'lucide-react';
import { getPlayers, saveMatchResults, getMatches, deleteMatch, deletePlayer, updatePlayerProfile, getMatchEntries, hardResetLeague, startNewSeason, getActiveSeasonId } from '../lib/db';
import type { Player, Match } from '../lib/db';
import { Modal } from '../components/Modal';
import { sounds } from '../lib/sounds';

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
  const [activeTab, setActiveTab] = useState<'scoring'|'players'|'manage'>('scoring');
  
  // Edit State
  const [editingPlayerId, setEditingPlayerId] = useState<string|null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerTeam, setEditPlayerTeam] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<string|null>(null);
  
  // Manage State
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentSeason, setCurrentSeason] = useState('season-1');
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm?: () => void }>({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (isAdmin) {
       const loadInitialData = async () => {
         try {
           const dbPlayers = await getPlayers();
           const dbMatches = await getMatches();
           const activeSsn = await getActiveSeasonId();
           setPlayers(dbPlayers);
           setMatches(dbMatches);
           setCurrentSeason(activeSsn);
           if (dbMatches.length > 0) {
              const maxNumber = Math.max(...dbMatches.map(m => m.matchNumber));
              setMatchNumber(String(maxNumber + 1));
           }
         } catch(e) { console.error(e) }
         setLoading(false);
       };
       loadInitialData();
    }
  }, [isAdmin]);

  const handleEndSeason = async () => {
    if (matches.length === 0) {
      return setModalConfig({ isOpen: true, title: "No Matches", message: "Cannot end a season with zero matches played." });
    }
    
    setLoading(true);
    try {
      const currentNumber = parseInt(currentSeason.replace(/\\D/g, '')) || 1;
      const nextSeasonId = `season-${currentNumber + 1}`;
      
      await startNewSeason(nextSeasonId);
      
      setCurrentSeason(nextSeasonId);
      const freshPlayers = await getPlayers();
      const freshMatches = await getMatches();
      setPlayers(freshPlayers);
      setMatches(freshMatches); // Should wipe current active matches
      setModalConfig({ isOpen: true, title: "Season Ended!", message: `The current season was permanently archived into the Hall of Fame. Starting fresh for ${nextSeasonId.toUpperCase()}!` });
    } catch(err) {
       console.error("End season failed", err);
       setModalConfig({ isOpen: true, title: "Error", message: "Failed to archive season." });
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return <Login />;
  }

  const handleScoreChange = (id: string, val: string) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const confirmDeletePlayer = (p: Player) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Player?",
      message: `Are you sure you want to permanently delete '${p.name}'? This cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        await deletePlayer(p.id);
        const freshPlayers = await getPlayers();
        setPlayers(freshPlayers);
        setLoading(false);
      }
    });
  };

  const confirmDeleteMatch = (m: Match) => {
    const title = (m as any).matchTitle || `Match ${m.matchNumber}`;
    setModalConfig({
      isOpen: true,
      title: "Delete Match?",
      message: `Are you sure you want to permanently delete '${title}'? This will recalculate all player points.`,
      onConfirm: async () => {
        setLoading(true);
        await deleteMatch(m.id);
        const freshPlayers = await getPlayers();
        const freshMatches = await getMatches();
        setPlayers(freshPlayers);
        setMatches(freshMatches);
        setLoading(false);
      }
    });
  };

  const startEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setEditPlayerName(p.name);
    setEditPlayerTeam(p.team || '');
  };

  const saveEditPlayer = async () => {
    if (!editingPlayerId) return;
    setLoading(true);
    await updatePlayerProfile(editingPlayerId, editPlayerName, editPlayerTeam);
    setEditingPlayerId(null);
    const freshPlayers = await getPlayers();
    setPlayers(freshPlayers);
    setLoading(false);
  };

  const handleEditMatch = async (m: Match) => {
    setLoading(true);
    try {
      const entries = await getMatchEntries(m.id);
      const tempScores: Record<string, string> = {};
      entries.forEach(e => {
        tempScores[e.playerId] = String(e.score);
      });
      setScores(tempScores);
      setMatchNumber(String(m.matchNumber));
      setMatchTitle((m as any).matchTitle || '');
      setEditingMatchId(m.id);
      setActiveTab('scoring');
    } catch (e) {
       console.error(e);
       setModalConfig({ isOpen: true, title: "Error", message: "Could not load match data for editing." });
    }
    setLoading(false);
  };

  const handleCreatePlayerAccount = async () => {
    if (!newPlayerName.trim() || !newPlayerEmail.trim() || !newPlayerPassword.trim()) {
      return setModalConfig({ isOpen: true, title: "Missing Fields", message: "Please fill in Name, Email, and Password." });
    }
    if (newPlayerPassword.length < 6) {
      return setModalConfig({ isOpen: true, title: "Invalid Password", message: "Password must be at least 6 characters." });
    }
    setIsAddingData(true);
    try {
      await createPlayerAccount(newPlayerEmail, newPlayerPassword, newPlayerName, newPlayerTeam);
      setModalConfig({ isOpen: true, title: "Success", message: `Account created for ${newPlayerName}!\nLogin: ${newPlayerEmail}` });
      setNewPlayerName('');
      setNewPlayerTeam('');
      setNewPlayerEmail('');
      setNewPlayerPassword('');
      // Refresh players list
      const freshPlayers = await getPlayers();
      setPlayers(freshPlayers);
    } catch(e: any) {
      console.error(e);
      setModalConfig({ isOpen: true, title: "Error", message: "Failed: " + (e.message || "Unknown error") });
    }
    setIsAddingData(false);
  };

  const handleSubmit = async () => {
     sounds.playThud();
     if (players.length === 0) return setModalConfig({ isOpen: true, title: "Oops!", message: "No players added." });
     
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
       // If editing an existing match, we first delete the old one so points perfectly recalculate 
       if (editingMatchId) {
         await deleteMatch(editingMatchId);
       }
       await saveMatchResults(Number(matchNumber), results, matchTitle);
       setModalConfig({ isOpen: true, title: "Match Saved", message: "Match results calculated and saved successfully!" });
       setScores({});
       setMatchNumber(String(Number(matchNumber) + 1));
       setMatchTitle('');
       setEditingMatchId(null);
       const freshPlayers = await getPlayers();
       const freshMatches = await getMatches();
       setPlayers(freshPlayers);
       setMatches(freshMatches);
     } catch (err) {
       console.error(err);
       setModalConfig({ isOpen: true, title: "Error", message: "Upload failed. Ensure Firebase is connected and rules are set." });
     }
     setIsAddingData(false);
  }

  if (loading) return (
    <div className={styles.container} style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="loader"></div>
    </div>
  );

  const handleHardReset = async () => {
    setLoading(true);
    try {
      await hardResetLeague();
      setModalConfig({ isOpen: true, title: "League Reset", message: "All matches, entries, and points have been completely wiped. Players are back to zero." });
      const freshPlayers = await getPlayers();
      const freshMatches = await getMatches();
      setPlayers(freshPlayers);
      setMatches(freshMatches);
    } catch (e) {
      console.error(e);
      setModalConfig({ isOpen: true, title: "Error", message: "Could not reset league." });
    }
    setLoading(false);
  };

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
          <img src="/default-avatar.svg" alt="Admin" className={styles.adminAvatar} />
        </div>
      </header>

      {/* Modal */}
      <Modal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        isDestructive={modalConfig.title.includes("Delete")}
      />

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
        <button 
          onClick={() => setActiveTab('manage')}
          style={{ 
            flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.8rem',
            background: activeTab === 'manage' ? 'var(--accent-primary)' : 'var(--bg-card)', 
            color: activeTab === 'manage' ? '#000' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
          MANAGE
        </button>
      </div>

      {activeTab === 'scoring' && (
        <>
          <section className={styles.identityGroup}>
            <div className={styles.identityCard}>
               <p className={styles.cardEyebrow}>{editingMatchId ? "EDITING MATCH" : "MATCH DATA"}</p>
               {editingMatchId && (
                 <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                   <p style={{ color: '#ef4444', fontSize: '0.75rem' }}>You are currently <strong>Fixing Match Data</strong>. Saving will overwrite the old points for this match.</p>
                   <button onClick={() => { setEditingMatchId(null); setScores({}); setMatchTitle(''); }} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer' }}>Cancel Edit</button>
                 </div>
               )}
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

      {activeTab === 'manage' && (
        <section className={styles.identityGroup}>
           <div className={styles.identityCard} style={{ marginBottom: '1rem' }}>
             <p className={styles.cardEyebrow}>MANAGE MATCHES ({matches.length})</p>
             <div style={{ marginTop: '0.75rem' }}>
               {matches.map(m => (
                 <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                   <div>
                     <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Match {m.matchNumber}</p>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{(m as any).matchTitle || ''}</p>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button onClick={() => handleEditMatch(m)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                       EDIT
                     </button>
                     <button onClick={() => confirmDeleteMatch(m)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               ))}
               {matches.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No matches found.</p>}
             </div>
           </div>

           <div className={styles.identityCard}>
             <p className={styles.cardEyebrow}>MANAGE PLAYERS ({players.length})</p>
             <div style={{ marginTop: '0.75rem' }}>
               {players.map(p => (
                 <div key={p.id} style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                   
                   {editingPlayerId === p.id ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <input 
                         type="text" value={editPlayerName} onChange={(e) => setEditPlayerName(e.target.value)}
                         className={styles.matchNumberInput} style={{ padding: '0.5rem' }} placeholder="Name"
                       />
                       <input 
                         type="text" value={editPlayerTeam} onChange={(e) => setEditPlayerTeam(e.target.value)}
                         className={styles.matchNumberInput} style={{ padding: '0.5rem' }} placeholder="Team"
                       />
                       <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                         <button onClick={saveEditPlayer} style={{ background: 'var(--accent-primary)', color: '#000', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Save</button>
                         <button onClick={() => setEditingPlayerId(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                       </div>
                     </div>
                   ) : (
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                         <img src={p.profileImage} alt={p.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                         <div>
                           <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</p>
                           <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.metrics.totalPoints} PTS</p>
                         </div>
                       </div>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button onClick={() => startEditPlayer(p)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                           EDIT
                         </button>
                         <button onClick={() => confirmDeletePlayer(p)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
               {players.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No players found.</p>}
             </div>
           </div>
           
           {/* Season Management */}
           <div style={{ marginTop: '3rem', padding: '1rem', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.05)' }}>
             <p className={styles.cardEyebrow} style={{ color: '#eab308' }}>SEASON MANAGEMENT</p>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
               This will permanently snapshot the current leaderboard into the Hall of Fame archive and wipe the live matrix cleanly to start a brand new season instantly.
             </p>
             <button 
               onClick={() => setModalConfig({
                  isOpen: true,
                  title: "End Season",
                  message: `Are you sure you want to end the current season? The leaderboard will be archived forever and everyone's active points will be set back to 0.`,
                  onConfirm: handleEndSeason
               })}
               style={{ 
                 width: '100%', padding: '0.75rem', borderRadius: '8px', 
                 background: '#eab308', color: '#000', border: 'none', 
                 fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
               }}
             >
               <Trophy size={16} /> END CURRENT SEASON
             </button>
           </div>
           
           {/* Danger Zone */}
           <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
             <p className={styles.cardEyebrow} style={{ color: '#ef4444' }}>DANGER ZONE</p>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
               This will permanently delete ALL matches and entirely reset all player 
               points, wins, and history back to 0. This cannot be undone.
             </p>
             <button 
               onClick={() => setModalConfig({ 
                 isOpen: true, 
                 title: "FACTORY RESET", 
                 message: "Are you absolutely sure you want to nuke the entire league? All matches and points will be destroyed forever.",
                 onConfirm: handleHardReset
               })}
               style={{ 
                 width: '100%', padding: '0.75rem', borderRadius: '8px', 
                 background: '#ef4444', color: '#fff', border: 'none', 
                 fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
               }}
             >
               <Trash2 size={16} /> FACTORY RESET LEAGUE
             </button>
           </div>
        </section>
      )}
    </div>
  );
};
