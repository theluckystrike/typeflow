import { getData } from '../../api/api';
import { User } from '../../types/types';
import React, { createContext, useState, ReactNode } from 'react';

interface UserContextType {
  user?: User;
  loading?: boolean;
  error?: boolean;
  getUser: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const getUser = async () => {
    setLoading(true);
    getData("auth/detail").then((data: any) => {
      setUser({ userId: data.user.user_id, email: data.user.email, subscriptionDetails: data.user.subscription_details, 
        dailyApiUsage: data.user.daily_api_usage, monthlyApiUsage: data.user.monthly_api_usage, 
        dailyApiLimit: data.user.daily_api_limit, monthlyApiLimit: data.user.monthly_api_limit });
      setLoading(false);
    }).catch((err) => {
      setError(true);
      setLoading(false);
      });
  };

  return (
    <UserContext.Provider value={{ user, loading, error, getUser }}>
      {children}
    </UserContext.Provider>
  );
};
