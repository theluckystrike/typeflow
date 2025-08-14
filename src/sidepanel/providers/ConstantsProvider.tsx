import { Profile } from '@/src/types/types';
import { getData, updateData } from '../../api/api';
import React, { createContext, useState, ReactNode } from 'react';
import { deleteCache } from '../../utils/cache';


interface ConstantsContextType {
  languages: string[];
  tones: string[];
  writingStyles: string[];
  profile: Profile | null;
  profiles: Profile[];
  updateProfile: (profile_id: string) => Promise<void>;
  getConstants: () => Promise<void>;
}

export const ConstantsContext = createContext<ConstantsContextType | undefined>(undefined);

interface ConstantsProviderProps {
  children: ReactNode;
}

export const ConstantsProvider: React.FC<ConstantsProviderProps> = ({ children }) => {
  const [languages, setLanguages] = useState<any>([]);
  const [tones, setTones] = useState<any>([]);
  const [writingStyles, setWritingStyles] = useState<any>([]);
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null);

  const getConstants = async () => {
    getData('utils/getSettingsList?language=true&tones=true&writing-styles=true').then((data: any) => {
      setLanguages(data.LANGUAGES);
      setTones(data.TONES);
      setWritingStyles(data.WRITING_STYLES);
    });
    getData('profiles').then((data: any) => {
      setProfiles(data.profiles)
    })
    getData('profile').then((data: any) => {
      setProfile(data.profile)
    })
  };

  const updateProfile = async (profile_id: string) => {
    deleteCache("shortcut/fixedShortcuts")
    updateData('profile', { profile_id }).then((data: any) => {
      setProfile(data.profile as Profile)
    })
  }

  return (
    <ConstantsContext.Provider value={{ languages, tones, writingStyles, profile, profiles, updateProfile, getConstants }}>
      {children}
    </ConstantsContext.Provider>
  );
};