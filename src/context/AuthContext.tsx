import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SupportedLanguage } from '../types';
import { api, setToken, clearToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shab_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('shab_lang') as SupportedLanguage) || 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('shab_lang', lang);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      localStorage.setItem('shab_user', JSON.stringify(u));
    } catch {
      setUser(null);
      clearToken();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('shab_token');
      if (token) {
        try {
          const u = await api.getMe();
          setUser(u);
          localStorage.setItem('shab_user', JSON.stringify(u));
        } catch {
          setUser(null);
          clearToken();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      clearToken();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('shab_user', JSON.stringify(res.user));
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.register({ full_name: fullName, email, password });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('shab_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        language,
        setLanguage,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
