'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Admin } from '@/types/api';

interface AuthStore {
  token: string | null;
  user: Admin | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: Admin) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string, user: Admin) => {
        set({ token, user, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      loadFromStorage: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('admin_user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ token, user, isAuthenticated: true });
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            set({ token: null, user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'mai-inji-auth',
      version: 1,
    }
  )
);
