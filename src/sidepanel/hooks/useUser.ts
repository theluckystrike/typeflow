import { useContext } from 'react';
import { UserContext } from '../providers/UserProvider';

export const userUser = () => {
const context = useContext(UserContext);
  if (!context) {
    throw new Error('userUser must be used within a UserProvider');
  }
  return context;
};
