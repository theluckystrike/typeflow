import { useContext } from 'react';
import { ProfilesContext } from '../providers/ProfilesProvider';

export const useProfiles = () => {
  const context = useContext(ProfilesContext);
  if (!context) {
    throw new Error('useProfiles must be used within a ProfilesProvider');
  }
  return context;
};