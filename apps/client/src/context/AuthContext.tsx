import React, { createContext, useContext, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type { AuthUser, LoginInput } from '@scb/shared';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [loginError, setLoginError] = useState<string | null>(null);

  // Fetch current session from /api/v1/auth/me
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<{ success: boolean; data: AuthUser }>('/auth/me');
        return response.data.data;
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      setLoginError(null);
      const response = await axiosInstance.post<{ success: boolean; data: AuthUser }>('/auth/login', credentials);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
    },
    onError: (error: Error) => {
      setLoginError(error.message || 'Login failed. Please verify your credentials.');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    },
  });

  const login = async (credentials: LoginInput) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
        loginError,
        isLoggingIn: loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
