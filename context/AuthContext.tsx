'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '../utils/api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'provider' | 'consumer';
  profileImage?: string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      const token = Cookies.get('admin_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<any>('/auth/me');
        if (response.success && response.data?.user) {
          const profile = response.data.user;
          
          // Check role eligibility
          if (profile.role !== 'admin' && profile.role !== 'super_admin') {
            Cookies.remove('admin_token');
            setUser(null);
            setIsAuthenticated(false);
            setError('Not authorized as an administrator');
          } else {
            setUser({
              id: profile._id || profile.id,
              email: profile.email,
              fullName: profile.fullName,
              role: profile.role,
              profileImage: profile.profileImage,
              phone: profile.phone,
            });
            setIsAuthenticated(true);
          }
        }
      } catch (err: any) {
        console.error('Failed to load user profile on mount:', err);
        Cookies.remove('admin_token');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<any>('/auth/login', { email, password });
      
      if (response.success && response.data) {
        const { tokens, user: profile } = response.data;
        
        if (!tokens || !tokens.accessToken) {
          throw new Error('Authentication tokens missing in server response');
        }

        // Check role
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          throw new Error('Access denied: Unauthorized role');
        }

        // Set Cookie (valid for 1 day)
        Cookies.set('admin_token', tokens.accessToken, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        
        setUser({
          id: profile._id || profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
          profileImage: profile.profileImage,
          phone: profile.phone,
        });
        setIsAuthenticated(true);
        router.push('/dashboard');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Invalid credentials or connection error';
      setError(errMsg);
      setIsLoading(false);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('admin_token');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    router.push('/login');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
