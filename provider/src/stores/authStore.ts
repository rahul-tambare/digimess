// ==========================================
// Auth Store (Zustand) — With Persistence
// ==========================================

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name?: string;
  phone: string;
  role: string;
  email?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isNewUser: boolean;
  user: User | null;
  phone: string;
  token: string | null;

  setPhone: (phone: string) => void;
  login: (token: string, user: any) => void;
  loginAsNewUser: (phone: string) => void;
  logout: () => void;
  hydrate: () => void;
}

// Persistence helpers — web uses localStorage, native uses SecureStore
const saveAuth = async (token: string | null, user: any) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      if (token && user) {
        localStorage.setItem('provider_auth_token', token);
        localStorage.setItem('provider_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('provider_auth_token');
        localStorage.removeItem('provider_auth_user');
      }
    } catch {}
  } else {
    try {
      if (token && user) {
        await SecureStore.setItemAsync('provider_auth_token', token);
        await SecureStore.setItemAsync('provider_auth_user', JSON.stringify(user));
      } else {
        await SecureStore.deleteItemAsync('provider_auth_token');
        await SecureStore.deleteItemAsync('provider_auth_user');
      }
    } catch {}
  }
};

const loadAuth = async (): Promise<{ token: string | null; user: any }> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('provider_auth_token');
      const userStr = localStorage.getItem('provider_auth_user');
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
    } catch {}
  } else {
    try {
      const token = await SecureStore.getItemAsync('provider_auth_token');
      const userStr = await SecureStore.getItemAsync('provider_auth_user');
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
    } catch {}
  }
  return { token: null, user: null };
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isNewUser: false,
  user: null,
  phone: '',
  token: null,

  setPhone: (phone) => set({ phone }),

  login: (token, user) => {
    saveAuth(token, user);
    set({
      isAuthenticated: true,
      isNewUser: false,
      user,
      token,
    });
  },

  loginAsNewUser: (phone) => set({
    isAuthenticated: true,
    isNewUser: true,
    phone,
    user: null,
    token: null,
  }),

  logout: () => {
    saveAuth(null, null);
    set({
      isAuthenticated: false,
      isNewUser: false,
      user: null,
      phone: '',
      token: null,
    });
  },

  // Called on app start to restore persisted auth
  hydrate: async () => {
    const { token, user } = await loadAuth();
    if (token && user) {
      set({
        isAuthenticated: true,
        isNewUser: false,
        user,
        token,
      });
    }
  },
}));

