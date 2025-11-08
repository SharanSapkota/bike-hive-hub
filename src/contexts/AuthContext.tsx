import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type UserRole = 'renter' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Mock authentication - accepts any email/password for now
      // TODO: Replace with real API call when backend is ready
      const response = await api.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      toast.success('Login successful!');
      
      /* Real API implementation:
      const response = await api.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      toast.success('Login successful!');
      */
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {

      // Mock registration - accepts any details for now
      // TODO: Replace with real API call when backend is ready
      const response = await api.post('/auth/register', { email, password, name, role });
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      toast.success('Registration successful!');
      
      /* Real API implementation:
      const response = await api.post('/auth/register', { email, password, name, role });
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      toast.success('Registration successful!');
      */
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
