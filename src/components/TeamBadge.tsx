import React from 'react';

export const TeamBadge: React.FC<{ team?: string }> = ({ team }) => {
  if (team) {
    return <span>{team}</span>;
  }
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      background: 'rgba(234, 179, 8, 0.15)', 
      color: '#EAB308', 
      padding: '2px 8px', 
      borderRadius: '12px', 
      fontSize: '0.65rem', 
      fontWeight: 700, 
      border: '1px solid rgba(234, 179, 8, 0.3)',
      textTransform: 'uppercase',
      lineHeight: 1
    }}>
      <span style={{ fontSize: '0.75rem' }}>🏏</span> SkyHigh Player
    </span>
  );
};
