import React from 'react';

/**
 * OfflineSyncStatusBar
 * Note: Offline sync mode is disabled per project online-first requirements.
 * This component safely renders null to prevent background polling, event listeners,
 * and UI distractions while maintaining backward compatibility.
 */
export const OfflineSyncStatusBar: React.FC = () => {
  return null;
};

export default OfflineSyncStatusBar;
