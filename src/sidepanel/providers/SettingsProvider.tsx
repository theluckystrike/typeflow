import { getData, postData } from '../../api/api';
import { Settings } from '../../types/types';
import React, { createContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  settings?: Settings;
  getSettings: () => void;
  updateSettings: (newSettings: Settings) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>();

  const getSettings = async () => {
    getData('user/settings').then((data: any) => {
      setSettings(data.userSettings);
    });
  };

  const updateSettings = async (newSettings: Settings) => {
    postData('user/settings', newSettings).then((data: any) => {
      setSettings(data.updatedSettings);
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, getSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};