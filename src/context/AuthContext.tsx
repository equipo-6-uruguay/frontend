import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth';
import { usersApiClient } from '../services/axiosConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider — Global authentication state provider.
 *
 * Uses HttpOnly cookies for JWT tokens. The browser sends cookies
 * automatically; the frontend never handles tokens directly.
 *
 * All API calls go through usersApiClient (axiosConfig) which centralises
 * base URL, interceptors, and credential handling.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersApiClient.get<User>('/auth/me/');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<void> => {
    const { data } = await usersApiClient.post<{ user: User }>('/auth/login/', {
      email,
      password,
    });
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    const { data } = await usersApiClient.post<{ user: User }>('/auth/', {
      username,
      email,
      password,
    });
    setUser(data.user);
  };

  const logout = async (): Promise<void> => {
    try {
      await usersApiClient.post('/auth/logout/');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume the AuthContext.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}