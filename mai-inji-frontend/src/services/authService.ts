import apiClient from './api';
import { ApiResponse, AuthToken, Admin } from '@/types/api';

const resolveAuth = (payload: unknown): AuthToken => {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiResponse<AuthToken>;
    if (envelope.success && envelope.data) {
      return envelope.data;
    }
    throw new Error(envelope.error || 'Login failed');
  }
  return payload as AuthToken;
};

export const authService = {
  /**
   * Admin login with email and password
   */
  login: async (email: string, password: string): Promise<AuthToken> => {
    try {
      const response = await apiClient.post<AuthToken | ApiResponse<AuthToken>>('/auth/login', {
        email,
        password,
      });

      const auth = resolveAuth(response.data);
      if (auth?.token && auth?.user) {
        const { token, user } = auth;
        // Store token and user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('admin_user', JSON.stringify(user));
        }
        return auth;
      }
      throw new Error('Login failed');
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  /**
   * Admin logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_user');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  /**
   * Get current admin user from localStorage
   */
  getCurrentUser: (): Admin | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if admin is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },
};
