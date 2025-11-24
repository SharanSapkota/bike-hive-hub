import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { sonnerToast } from '@/components/ui/sonnertoast';
import { clearAccessToken, setAccessToken } from './tokenStore';

export type UserRole = 'renter' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface RegisterPayload {
  firstName,
  middleName,
  lastName,
  phone,
  address: {
    country,
    city,
    state,
    postalCode,
  },
  dob,
  password,
  confirmPassword,
  email,
  role,
}

interface AuthContextType {
  user: User | null;
  token: string | null; // Deprecated: kept for backward compatibility, but not used with httpOnly cookies
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // Deprecated: kept for backward compatibility
  const [loading, setLoading] = useState(true);
  const justLoggedInRef = useRef(false);

  useEffect(() => {
   
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(false);
        
      } catch (error) {
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/vlogin', { email, password }, { withCredentials: true });
      const payload = response.data?.data ?? response.data;
      const userData = payload?.user ?? payload;

      if (!userData) {
        throw new Error('invalid_login_response');
      }

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setAccessToken(payload.token ?? null);
      setToken(payload.token);
      setLoading(false);
      sonnerToast('Login successful!', 'You have successfully logged in to your account.');

      return userData;
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const response = await api.post('/auth/signup', payload);
      const payloadResponse = response.data?.data ?? response.data;
      const userData = payloadResponse?.data?.user ?? payloadResponse?.user ?? payloadResponse;

      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData); 
      }

      sonnerToast('Registration successful!', 'You have successfully registered for an account.');
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      clearAccessToken();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      sonnerToast('Logged out successfully', 'You have successfully logged out of your account.');
    }
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
        isAuthenticated: !!user,
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
