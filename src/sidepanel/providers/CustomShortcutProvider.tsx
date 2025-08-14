import { getData, postData, deleteData, updateData } from '../../api/api';
import { Shortcut } from '../../types/types';
import React, { createContext, useState, ReactNode } from 'react';

interface CustomShortcutsContextType {
  loading: boolean;
  error?: boolean;
  success?: boolean;
  customShortcuts?: Shortcut[];
  editShortcut?: Shortcut | null;
  getCustomShortcuts: () => void;
  updateCustomShortcuts: (customShortcuts: Shortcut[]) => void;
  getShortcut: (id: string) => void;
  createCustomShortcut: (newShortcut: { shortcut_keys: string; prompt: string }) => void;
  updateCustomShortcut: (id: string, updatedShortcut: any) => void;
  deleteCustomShortcut: (id: string) => void;
}

export const CustomShortcutsContext = createContext<CustomShortcutsContextType | undefined>(undefined);

interface CustomShortcutsProviderProps {
  children: ReactNode;
}

export const CustomShortcutsProvider: React.FC<CustomShortcutsProviderProps> = ({ children }) => {
  const [customShortcuts, setCustomShortcuts] = useState<Shortcut[]>([]);
  const [editShortcut, setEditShortcut] = useState<Shortcut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const getCustomShortcuts = async () => {
    setLoading(true);
    setError(false);
    setSuccess(false);
    try {
      const data: any = await getData('shortcut/getAllShortcut');
      setCustomShortcuts(data.shortcut);
      setSuccess(true);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomShortcuts = async (customShortcuts: Shortcut[]) => {
    setCustomShortcuts(customShortcuts);
  }

  const getShortcut = async (id: string) => {
    setLoading(true);
    setError(false);
    setSuccess(false);
    try {
      const data: any = await getData(`shortcut/getShortcut/${id}`);
      setEditShortcut(data.shortcut);
      setSuccess(true);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const createCustomShortcut = async (newShortcut: { shortcut_keys: string; prompt: string }) => {
    setLoading(true);
    setError(false);
    setSuccess(false);
    try {
      const data: any = await postData('shortcut/createShortcut', newShortcut);
      setCustomShortcuts((prevShortcuts) => [...prevShortcuts, data.shortcut]);
      setSuccess(true);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomShortcut = async (id: string, updatedShortcut: Shortcut) => {
    setLoading(true);
    setError(false);
    setSuccess(false);
    try {
      const data: any = await updateData(`shortcut/updateShortcut`, updatedShortcut);
      setCustomShortcuts((prevShortcuts) =>
        prevShortcuts.map((shortcut) => (shortcut.id === id ? data.shortcut : shortcut))
      );
      getCustomShortcuts();
      setSuccess(true);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomShortcut = async (id: string) => {
    setLoading(true);
    setError(false);
    setSuccess(false);
    try {
      await deleteData(`shortcut/removeShortcut/${id}`);
      setCustomShortcuts((prevShortcuts) => prevShortcuts.filter((shortcut) => shortcut.shortcut_id !== id));
      setSuccess(true);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomShortcutsContext.Provider
      value={{ loading, error, success, customShortcuts, editShortcut, getCustomShortcuts, updateCustomShortcuts, getShortcut, createCustomShortcut, updateCustomShortcut, deleteCustomShortcut }}
    >
      {children}
    </CustomShortcutsContext.Provider>
  );
};