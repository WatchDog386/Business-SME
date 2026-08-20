import { create } from 'zustand';
import type { User } from '@/api/types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

function readToken(): string | null {
  return localStorage.getItem('ksa_token');
}

export const useAuthStore = create<AuthState>((set) => ({
  token: readToken(),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('ksa_token', token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('ksa_token');
    localStorage.removeItem('ksa_business_id');
    set({ token: null, user: null });
  },
}));