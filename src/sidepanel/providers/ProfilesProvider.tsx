import { Profile } from '@/src/types/types';
import { getData, updateData } from '../../api/api';
import React, { createContext, useState, ReactNode } from 'react';
import { deleteCache } from '../../utils/cache';


interface ProfilesContextType {
  loading: boolean;
  profile: Profile | null;
  profiles: Profile[];
  getProfile: () => Promise<void>;
  getProfiles: () => Promise<void>;
  updateProfile: (profile_id: string) => Promise<void>;
}

export const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined);

interface ProfilesProviderProps {
  children: ReactNode;
}

export const ProfilesProvider: React.FC<ProfilesProviderProps> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const getProfiles = async () => {
    setLoading(true);
    getData('profiles').then((data: any) => {
      setProfiles(data.profiles)
      setLoading(false);
    })
  };

  const getProfile = async () => {
    setLoading(true);
    getData('profile').then((data: any) => {
      setProfile(data.profile)
      setLoading(false);
    })
  }

  const updateProfile = async (profile_id: string) => {
    setLoading(true);
    const data: any = await updateData('profile', { profile_id })
    setProfile(data.profile)
    setLoading(false);
  }

  return (
    <ProfilesContext.Provider value={{ loading, profile, profiles, updateProfile, getProfile, getProfiles }}>
      {children}
    </ProfilesContext.Provider>
  );
};