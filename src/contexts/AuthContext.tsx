import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  login: (email: string, password: string) => Promise<User>;
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
      // MOCK LOGIN - Comment out API call
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data?.data ?? response.data;
      const authToken = payload?.token;
      const userData = payload?.user;

      // Mock credentials
      // let userData: User | null = null;
      
      // if (email === 'renter@gmail.com') {
      //   userData = {
      //     id: 'renter-1',
      //     email: 'renter@gmail.com',
      //     name: 'Renter User',
      //     role: 'renter' as UserRole,
      //   };
      // } else if (email === 'owner@gmail.com') {
      //   userData = {
      //     id: 'owner-1',
      //     email: 'owner@gmail.com',
      //     name: 'Owner User',
      //     role: 'owner' as UserRole,
      //   };
      // } else {
      //   throw new Error('Invalid credentials');
      // }

      // const authToken = 'mock-token-' + email;

      // if (!authToken || !userData) {
      //   throw new Error('invalid_login_response');
      // }

      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      toast.success('Login successful!');

      return userData;
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      // MOCK REGISTRATION - Comment out API call
      // const response = await api.post('/auth/signup', { email, password, name, role });
      // const payload = response.data?.data ?? response.data;
      // const authToken = payload?.token;
      // const userData = payload?.user;

      // Mock registration
      const userData: User = {
        id: 'user-' + Date.now(),
        email,
        name,
        role,
      };
      const authToken = 'mock-token-' + email;

      if (authToken && userData) {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
      }

      toast.success('Registration successful!');
    } catch (error: any) {
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
