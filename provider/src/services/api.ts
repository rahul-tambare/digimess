// =============================================
// API Service Layer for Provider App
// =============================================

import { useAuthStore } from '../stores/authStore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Auto-detect correct API base URL
const getApiBase = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // For physical devices, use the host IP from expo constants
  const debuggerHost = Constants.expoConfig?.hostUri;
  const hostIP = debuggerHost?.split(':')[0];

  if (hostIP) {
    return `http://${hostIP}:5000/api`;
  }

  // Fallback for Android emulator
  return 'http://10.0.2.2:5000/api';
};

const API_BASE = getApiBase();

// ---- Core fetch wrapper ----

async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ---- Auth ----

export const authApi = {
  sendOTP: (phone: string) =>
    apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),

  verifyOTP: (phone: string, otp: string, role: string = 'vendor') =>
    apiFetch<{ token: string; user: any; message: string }>(
      '/auth/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, otp, role }) }
    ),
};

// ---- Provider Dashboard ----

export const providerApi = {
  getDashboard: () =>
    apiFetch('/provider/dashboard'),

  getEarnings: () =>
    apiFetch('/provider/earnings'),

  getTransactions: (page: number = 1, limit: number = 20) =>
    apiFetch(`/provider/earnings/transactions?page=${page}&limit=${limit}`),

  updateProfile: (data: { name?: string; email?: string; gender?: string; dateOfBirth?: string }) =>
    apiFetch('/provider/profile', { method: 'PUT', body: JSON.stringify(data) }),

  toggleMess: () =>
    apiFetch<{ isOpen: boolean; message: string }>('/provider/mess/toggle', { method: 'PATCH' }),

  getOrderDetail: (orderId: string) =>
    apiFetch(`/provider/orders/${orderId}`),

  getStats: () =>
    apiFetch('/provider/stats'),
};

// ---- Mess ----

export const messApi = {
  getMyMesses: () =>
    apiFetch('/messes/provider/my-messes'),

  registerMess: (data: any) =>
    apiFetch('/messes/register', { method: 'POST', body: JSON.stringify(data) }),

  updateMess: (messId: string, data: any) =>
    apiFetch(`/messes/${messId}`, { method: 'PUT', body: JSON.stringify(data) }),

  updateSettings: (messId: string, data: any) =>
    apiFetch(`/messes/${messId}/settings`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ---- Orders ----

export const orderApi = {
  getProviderOrders: () =>
    apiFetch('/orders/provider/my-orders'),

  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getForecast: () =>
    apiFetch('/orders/provider/forecast'),
};

// ---- Menus ----

export const menuApi = {
  getMessMenu: (messId: string) =>
    apiFetch(`/menus/mess/${messId}`),

  addMenuItem: (data: { messId: string; itemName: string; price: number; isVeg?: boolean; category?: string }) =>
    apiFetch('/menus', { method: 'POST', body: JSON.stringify(data) }),

  updateMenuItem: (menuId: string, data: any) =>
    apiFetch(`/menus/${menuId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMenuItem: (menuId: string) =>
    apiFetch(`/menus/${menuId}`, { method: 'DELETE' }),
};

// ---- Thalis ----

export const thaliApi = {
  getMessThalis: (messId: string) =>
    apiFetch(`/thalis/mess/${messId}`),

  addThali: (data: {
    messId: string; name: string; mealTime?: string; type?: string;
    itemsIncluded?: string; price: number; discountedPrice?: number;
    isSubscriptionThali?: boolean; subscriptionExtraCharge?: number;
  }) =>
    apiFetch('/thalis', { method: 'POST', body: JSON.stringify(data) }),

  updateThali: (thaliId: string, data: any) =>
    apiFetch(`/thalis/${thaliId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteThali: (thaliId: string) =>
    apiFetch(`/thalis/${thaliId}`, { method: 'DELETE' }),

  toggleAvailability: (thaliId: string) =>
    apiFetch<{ isAvailable: boolean }>(`/thalis/${thaliId}/toggle`, { method: 'PATCH' }),

  toggleSpecial: (thaliId: string) =>
    apiFetch<{ isSpecial: boolean }>(`/thalis/${thaliId}/special`, { method: 'PATCH' }),
};

// ---- Vendor / Bank ----

export const vendorApi = {
  getBankDetails: () =>
    apiFetch('/vendor/bank-details'),

  createBankDetails: (data: {
    bankName?: string; accountNumber: string;
    accountHolderName: string; ifscCode: string; upiId?: string;
  }) =>
    apiFetch('/vendor/bank-details', { method: 'POST', body: JSON.stringify(data) }),

  updateBankDetails: (data: any) =>
    apiFetch('/vendor/bank-details', { method: 'PUT', body: JSON.stringify(data) }),
};

// ---- Reviews ----

export const reviewApi = {
  getProviderReviews: () =>
    apiFetch('/messes/provider/reviews'),
};
