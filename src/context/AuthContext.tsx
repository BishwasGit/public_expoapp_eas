import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import apiClient from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (alias: string, pin: string) => Promise<void>;
  register: (alias: string, pin: string, role: 'PATIENT' | 'PSYCHOLOGIST') => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (alias: string, pin: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        alias,
        pin,
      });

      // Backend returns: { success, data: { access_token, user } }
      const { access_token, user: userData } = response.data.data;

      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (
    alias: string,
    pin: string,
    role: 'PATIENT' | 'PSYCHOLOGIST'
  ) => {
    try {
      await apiClient.post('/auth/signup', {
        alias,
        pin,
        role,
      });

      // Auto-login after registration
      await login(alias, pin);
    } catch (error) {
      throw error;
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
