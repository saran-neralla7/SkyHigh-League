import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import styles from './MatchDetails.module.css';

export const MatchDetails: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="#FFD700" />
          <h1>MATCH RESULTS</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.finalStatus}>FINAL</span>
          <MoreVertical size={24} className={styles.moreIcon} />
        </div>
      </header>
      
      <div className={styles.titleSection}>
         <h2>Weekly Elite</h2>
         <p>MUMBAI INDIANS VS RCB • 24 OCT</p>
      </div>

      <section className={styles.podiumSection}>
         {/* Rank 1 */}
         <div className={`${styles.podiumCard} ${styles.rank1Card}`}>
            <div className={styles.rankBadge1}>1</div>
            <div className={styles.avatarBlock1}>
               <img src="https://i.pravatar.cc/150?u=arjun2" className={styles.avatarMain} alt="Arjun Sharma" />
               <div className={styles.detailsMain}>
                  <h3>Arjun Sharma</h3>
                  <p>SCORE: <span className={styles.ptsGold}>942.5</span></p>
               </div>
            </div>
            <div className={styles.rewardBlock1}>
               <span className={styles.rewardGold}>+12,500</span>
               <span className={styles.rewardLabel}>📈 TOP 0.1%</span>
            </div>
         </div>
         
         <div className={styles.podiumSplitRow}>
            {/* Rank 2 */}
            <div className={styles.podiumCardSplit}>
               <div className={styles.rankBadge2}>2</div>
               <img src="https://i.pravatar.cc/150?u=vikram2" className={styles.avatarSplit} alt="Vikram K." />
               <h3>Vikram K.</h3>
               <p className={styles.scorePlain}>884.0</p>
               <p className={styles.rewardPlain}>+₹7,500</p>
            </div>
            {/* Rank 3 */}
            <div className={styles.podiumCardSplit}>
               <div className={styles.rankBadge3}>3</div>
               <img src="https://i.pravatar.cc/150?u=rohan2" className={styles.avatarSplit} alt="Rohan Mehta" />
               <h3>Rohan Mehta</h3>
               <p className={styles.scorePlainGold}>876.5</p>
               <p className={styles.rewardPlain}>+₹4,000</p>
            </div>
         </div>
      </section>

      <div className={styles.sectionEyebrow}>THE FIELD</div>
      
      <section className={styles.fieldList}>
         
         <div className={styles.fieldRow}>
            <span className={styles.fieldRank}>4</span>
            <div className={styles.fieldPlayerInfo}>
               <img src="https://i.pravatar.cc/150?u=priya2" alt="Priya Singh" className={styles.fieldAvatar} />
               <div className={styles.fieldNameStack}>
                  <h4>Priya Singh</h4>
                  <p>812.0 PTS</p>
               </div>
            </div>
            <div className={styles.fieldPoints}>
               <span className={styles.fieldPtsPositive}>+₹1,200</span>
               <span className={styles.fieldPtsLabel}>IN THE MONEY</span>
            </div>
         </div>
         
         <div className={styles.fieldRow}>
            <span className={styles.fieldRank}>5</span>
            <div className={styles.fieldPlayerInfo}>
               <img src="https://i.pravatar.cc/150?u=kabir2" alt="Kabir Das" className={styles.fieldAvatar} />
               <div className={styles.fieldNameStack}>
                  <h4>Kabir Das</h4>
                  <p>794.5 PTS</p>
               </div>
            </div>
            <div className={styles.fieldPoints}>
               <span className={styles.fieldPtsPositive}>+₹800</span>
               <span className={styles.fieldPtsLabel}>IN THE MONEY</span>
            </div>
         </div>

         <div className={styles.fieldRow}>
            <span className={styles.fieldRank}>6</span>
            <div className={styles.fieldPlayerInfo}>
               <img src="https://i.pravatar.cc/150?u=zayan2" alt="Zayan Malik" className={styles.fieldAvatar} />
               <div className={styles.fieldNameStack}>
                  <h4>Zayan Malik</h4>
                  <p>780.0 PTS</p>
               </div>
            </div>
            <div className={styles.fieldPoints}>
               <span className={styles.fieldPtsNeutral}>—</span>
            </div>
         </div>

      </section>

    </div>
  );
};
