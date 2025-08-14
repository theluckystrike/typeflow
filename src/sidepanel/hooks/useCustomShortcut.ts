import { useContext } from 'react';
import { CustomShortcutsContext } from '../providers/CustomShortcutProvider';

export const useCustomShortcuts = () => {
  const context = useContext(CustomShortcutsContext);
  if (!context) {
    throw new Error('useCustomShortcuts must be used within a CustomShortcutsProvider');
  }
  return context;
};