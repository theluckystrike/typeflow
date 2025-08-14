import { useContext } from 'react';
import { ConstantsContext } from '../providers/ConstantsProvider';

export const useConstants = () => {
  const context = useContext(ConstantsContext);
  if (!context) {
    throw new Error('useConstants must be used within a ConstantsProvider');
  }
  return context;
};