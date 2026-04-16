// =============================================
// Auth Store (Zustand) — Consumer App
// =============================================
// Mirrors provider's authStore pattern with web persistence.

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  role: string;
  dietaryPreference?: string;
  walletBalance?: number;
  location?: { lat: number; lng: number; area: string };
  savedAddresses?: any[];
}

interface AuthState {
  isAuthenticated: boolean;
  isNewUser: boolean;
  user: User | null;
  phone: string;
  token: string | null;

  setPhone: (phone: string) => void;
  login: (token: string, user: User) => void;
  loginAsNewUser: (phone: string) => void;
  setUser: (user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  hydrate: () => void;
}

// Persistence helpers for web (localStorage)
const saveAuth = async (token: string | null, user: any) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      if (token && user) {
        localStorage.setItem('consumer_auth_token', token);
        localStorage.setItem('consumer_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('consumer_auth_token');
        localStorage.removeItem('consumer_auth_user');
      }
    } catch {}
  } else {
    try {
      if (token && user) {
        await SecureStore.setItemAsync('consumer_auth_token', token);
        await SecureStore.setItemAsync('consumer_auth_user', JSON.stringify(user));
      } else {
        await SecureStore.deleteItemAsync('consumer_auth_token');
        await SecureStore.deleteItemAsync('consumer_auth_user');
      }
    } catch {}
  }
};

const loadAuth = async (): Promise<{ token: string | null; user: any }> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('consumer_auth_token');
      const userStr = localStorage.getItem('consumer_auth_user');
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
    } catch {}
  } else {
    try {
      const token = await SecureStore.getItemAsync('consumer_auth_token');
      const userStr = await SecureStore.getItemAsync('consumer_auth_user');
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

  setUser: async (user) => {
    set({ user });
    // Re-save with existing token
    const { token } = await loadAuth();
    if (token) saveAuth(token, user);
  },

  updateUser: async (data) => {
    const state = useAuthStore.getState();
    const updatedUser = state.user ? { ...state.user, ...data } : null;
    if (updatedUser && state.token) saveAuth(state.token, updatedUser);
    set({ user: updatedUser });
  },

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
