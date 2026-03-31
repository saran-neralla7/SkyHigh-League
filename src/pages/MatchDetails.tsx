import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import styles from './MatchDetails.module.css';
import { getMatch, getMatchEntries, getPlayers } from '../lib/db';

export const MatchDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);
  const [podium, setPodium] = useState<any[]>([]);
  const [field, setField] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const dbMatch = await getMatch(id);
        const dbEntries = await getMatchEntries(id);
        const dbPlayers = await getPlayers();

        if (dbMatch) {
          const dateStr = dbMatch.createdAt?.toDate ? dbMatch.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
          setMatchData({ name: `MATCH ${dbMatch.matchNumber}`, date: dateStr });
        }

        const enrichedEntries = dbEntries.map(e => {
          const p = dbPlayers.find(pl => pl.id === e.playerId);
          return {
            ...e,
            playerName: p ? p.name : 'Unknown',
            playerAvatar: p ? p.profileImage : '/default-avatar.svg'
          };
        }).sort((a,b) => a.rank - b.rank);

        const r1 = enrichedEntries.find(e => e.rank === 1);
        const r2 = enrichedEntries.find(e => e.rank === 2);
        const r3 = enrichedEntries.find(e => e.rank === 3);

        setPodium([r2, r1, r3]); // [Rank2, Rank1, Rank3]
        setField(enrichedEntries.filter(e => e.rank > 3));

      } catch (err) {
        console.error("Failed to load match details", err);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-4" style={{color: "var(--text-secondary)"}}>Loading Details...</div>;
  if (!matchData) return <div className="p-4" style={{color: "var(--text-secondary)"}}>Match Not Found.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft} onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>
          <ArrowLeft size={24} color="#FFD700" />
          <h1>MATCH RESULTS</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.finalStatus}>FINAL</span>
          <MoreVertical size={24} className={styles.moreIcon} />
        </div>
      </header>
      
      <div className={styles.titleSection}>
         <h2>{matchData.name}</h2>
         <p>{matchData.date}</p>
      </div>

      <section className={styles.podiumSection}>
         {/* Rank 1 */}
         {podium[1] && (
           <div className={`${styles.podiumCard} ${styles.rank1Card}`}>
              <div className={styles.rankBadge1}>1</div>
              <div className={styles.avatarBlock1}>
                 <img src={podium[1].playerAvatar} className={styles.avatarMain} alt={podium[1].playerName} />
                 <div className={styles.detailsMain}>
                    <h3>{podium[1].playerName}</h3>
                    <p>SCORE: <span className={styles.ptsGold}>{podium[1].score}</span></p>
                 </div>
              </div>
              <div className={styles.rewardBlock1}>
                 <span className={styles.rewardGold}>+{podium[1].pointsAwarded} PTS</span>
                 <span className={styles.rewardLabel}>ELITE</span>
              </div>
           </div>
         )}
         
         <div className={styles.podiumSplitRow}>
            {/* Rank 2 */}
            {podium[0] && (
              <div className={styles.podiumCardSplit}>
                 <div className={styles.rankBadge2}>2</div>
                 <img src={podium[0].playerAvatar} className={styles.avatarSplit} alt={podium[0].playerName} />
                 <h3>{podium[0].playerName}</h3>
                 <p className={styles.scorePlain}>{podium[0].score}</p>
                 <p className={styles.rewardPlain}>+{podium[0].pointsAwarded} PTS</p>
              </div>
            )}
            
            {/* Rank 3 */}
            {podium[2] && (
              <div className={styles.podiumCardSplit}>
                 <div className={styles.rankBadge3}>3</div>
                 <img src={podium[2].playerAvatar} className={styles.avatarSplit} alt={podium[2].playerName} />
                 <h3>{podium[2].playerName}</h3>
                 <p className={styles.scorePlainGold}>{podium[2].score}</p>
                 <p className={styles.rewardPlain}>+{podium[2].pointsAwarded} PTS</p>
              </div>
            )}
         </div>
      </section>

      {field.length > 0 && (
        <>
          <div className={styles.sectionEyebrow}>THE FIELD</div>
          <section className={styles.fieldList}>
             {field.map(f => (
               <div key={f.id} className={styles.fieldRow}>
                  <span className={styles.fieldRank}>{f.rank}</span>
                  <div className={styles.fieldPlayerInfo}>
                     <img src={f.playerAvatar} alt={f.playerName} className={styles.fieldAvatar} />
                     <div className={styles.fieldNameStack}>
                        <h4>{f.playerName}</h4>
                        <p>{f.score} PTS</p>
                     </div>
                  </div>
                  <div className={styles.fieldPoints}>
                     {f.pointsAwarded > 0 ? (
                       <span className={styles.fieldPtsPositive}>+{f.pointsAwarded} PTS</span>
                     ) : (
                       <span className={styles.fieldPtsNeutral}>—</span>
                     )}
                  </div>
               </div>
             ))}
          </section>
        </>
      )}

    </div>
  );
};
