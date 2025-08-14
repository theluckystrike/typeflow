import { useContext } from 'react';
import { SettingsContext } from '../providers/SettingsProvider';

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};