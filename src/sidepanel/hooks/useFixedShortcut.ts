import { useContext } from 'react';
import { FixedShortcutsContext } from '../providers/FixedShortcutProvider';

export const useFixedShortcuts = () => {
  const context = useContext(FixedShortcutsContext);
  if (!context) {
    throw new Error('useFixedShortcuts must be used within a FixedShortcutsProvider');
  }
  return context;
};