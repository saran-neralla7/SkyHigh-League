import React, { useState, useEffect } from 'react';
import styles from './MatrixTable.module.css';
import { getPlayers, getMatches, getPlayerEntries } from '../lib/db';
import type { Player, Match, Entry } from '../lib/db';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MatrixTable: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  // map of playerId -> map of matchId -> entry
  const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, Entry>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        const dbPlayers = await getPlayers();
        const dbMatches = await getMatches();
        
        // Sort matches oldest to newest for columns
        const sortedMatches = [...dbMatches].sort((a,b) => a.matchNumber - b.matchNumber);
        
        const map: Record<string, Record<string, Entry>> = {};
        
        for (const p of dbPlayers) {
          const pEntries = await getPlayerEntries(p.id);
          map[p.id] = {};
          pEntries.forEach(e => {
            map[p.id][e.matchId] = e;
          });
        }

        setPlayers(dbPlayers);
        setMatches(sortedMatches);
        setEntriesMap(map);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchMatrixData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
      <Loader2 className="animate-spin" color="var(--text-secondary)" />
    </div>
  );

  if (matches.length === 0 || players.length === 0) return null;

  return (
    <div className={styles.matrixWrapper}>
      <h3 className={styles.matrixTitle}>THE MATRIX</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.stickyColumn}>Player</th>
              <th className={styles.totalColumn}>Total</th>
              {matches.map(m => (
                <th key={m.id} className={styles.matchHeader}>
                  <div className={styles.matchHeadInner}>
                    <span>M{m.matchNumber}</span>
                    <span className={styles.matchSub}>{(m as any).matchTitle || ''}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <motion.tr 
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <td className={styles.stickyColumn}>
                  <div className={styles.playerCell}>
                    <img src={p.profileImage} alt={p.name} className={styles.cellAvatar} />
                    <span className={styles.cellName}>{p.name}</span>
                  </div>
                </td>
                <td className={styles.totalCell}>{p.metrics.totalPoints}</td>
                {matches.map(m => {
                  const entry = entriesMap[p.id]?.[m.id];
                  let cellClass = styles.cellNeutral;
                  if (entry) {
                    if (entry.rank === 1) cellClass = styles.cellGold;
                    else if (entry.rank === 2) cellClass = styles.cellSilver;
                    else if (entry.rank === 3) cellClass = styles.cellBronze;
                  }

                  return (
                    <td key={m.id} className={`${styles.scoreCell} ${cellClass}`}>
                      {entry ? `+${entry.pointsAwarded}` : '-'}
                      {entry?.score !== undefined && (
                        <div className={styles.rawScoreText}>{entry.score} pts</div>
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
