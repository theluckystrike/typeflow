import { getData } from '../../api/api';
import { Shortcut } from '../../types/types';
import React, { createContext, useState, ReactNode } from 'react';

interface FixedShortcutsContextType {
  loading: boolean;
  error?: boolean;
  success?: boolean;
  fixedShortcuts?: Shortcut[];
  getFixedShortcuts: () => void;
  updateFixedShortcuts: (fixedShortcuts: Shortcut[]) => void;
}

export const FixedShortcutsContext = createContext<FixedShortcutsContextType | undefined>(undefined);

interface FixedShortcutsProviderProps {
  children: ReactNode;
}

export const FixedShortcutsProvider: React.FC<FixedShortcutsProviderProps> = ({ children }) => {
  const [fixedShortcuts, setFixedShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const getFixedShortcuts = async () => {
    setLoading(true);
    setError(false);
    setSuccess(false);
    try {
      const data: any = await getData('shortcut/fixedShortcuts');
      setFixedShortcuts(data.shorcuts);
      setSuccess(true);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const updateFixedShortcuts = async (fixedShortcuts: Shortcut[]) => {
    setFixedShortcuts(fixedShortcuts)
  }

  return (
    <FixedShortcutsContext.Provider
      value={{ loading, error, success, fixedShortcuts, getFixedShortcuts, updateFixedShortcuts }}
    >
      {children}
    </FixedShortcutsContext.Provider>
  );
};