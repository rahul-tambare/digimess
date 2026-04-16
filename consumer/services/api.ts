// =============================================
// API Service Layer for Consumer App
// =============================================
// Mirrors the provider app's api.ts pattern.
// All endpoints match the unified backend architecture.

import { useAuthStore } from './authStore';
import { Platform } from 'react-native';

// Auto-detect correct API base URL
const getApiBase = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // For Android emulator use 10.0.2.2, for real device use your computer's IP
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

  verifyOTP: (phone: string, otp: string) =>
    apiFetch<{ token: string; user: any; isNewUser?: boolean; message: string }>(
      '/auth/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, otp, role: 'customer' }) }
    ),
};

// ---- User Profile ----

export const userApi = {
  getProfile: () =>
    apiFetch('/user/profile'),

  updateProfile: (data: { name?: string; email?: string; dietaryPreference?: string; locationLat?: number; locationLng?: number; locationArea?: string }) =>
    apiFetch('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ---- Mess Discovery ----

export const messApi = {
  listMesses: (params?: { lat?: number; lng?: number; mealTime?: string; type?: string; search?: string; sort?: string }) => {
    const apiParams: Record<string, string> = {};
    if (params?.lat) apiParams.userLat = String(params.lat);
    if (params?.lng) apiParams.userLng = String(params.lng);
    if (params?.mealTime) apiParams.mealTime = params.mealTime;
    if (params?.type) apiParams.type = params.type;
    if (params?.search) apiParams.search = params.search;
    if (params?.sort) apiParams.sort = params.sort;

    const qs = new URLSearchParams(apiParams).toString();
    return apiFetch(`/messes${qs ? `?${qs}` : ''}`);
  },

  getMessDetail: (messId: string, lat?: number, lng?: number) => {
    const apiParams: Record<string, string> = {};
    if (lat) apiParams.userLat = String(lat);
    if (lng) apiParams.userLng = String(lng);
    const qs = new URLSearchParams(apiParams).toString();
    return apiFetch(`/messes/${messId}${qs ? `?${qs}` : ''}`);
  },

  searchMesses: (query: string, lat?: number, lng?: number) => {
    const apiParams: Record<string, string> = { search: query };
    if (lat) apiParams.userLat = String(lat);
    if (lng) apiParams.userLng = String(lng);
    const qs = new URLSearchParams(apiParams).toString();
    return apiFetch(`/messes?${qs}`);
  },
};

// ---- Thalis ----

export const thaliApi = {
  getMessThalis: (messId: string) =>
    apiFetch(`/thalis/mess/${messId}`),
};

// ---- Orders ----

export const orderApi = {
  placeOrder: (data: {
    messId: string;
    items: { thaliId: string; name: string; quantity: number; price: number }[];
    deliveryType: string;
    deliverySlot?: string;
    paymentMethod: string;
    address?: string;
    specialNote?: string;
    couponId?: string;
    subscriptionId?: string;
  }) =>
    apiFetch<{ id: string; message: string }>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  getMyOrders: () =>
    apiFetch('/orders'),

  getOrderDetail: (orderId: string) =>
    apiFetch(`/orders/${orderId}`),

  reorder: (orderId: string) =>
    apiFetch(`/orders/${orderId}/reorder`, { method: 'POST' }),
};

// ---- Wallet ----

export const walletApi = {
  getBalance: () =>
    apiFetch<{ balance: number }>('/wallet/balance'),

  getTransactions: (page: number = 1, limit: number = 20) =>
    apiFetch(`/wallet/transactions?page=${page}&limit=${limit}`),

  initiateTopUp: (amount: number, paymentMethod: string) =>
    apiFetch('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount, paymentMethod }) }),

  verifyTopUp: (sessionId: string) =>
    apiFetch('/wallet/topup/verify', { method: 'POST', body: JSON.stringify({ sessionId }) }),
};

// ---- Subscriptions ----

export const subscriptionApi = {
  getPlans: () =>
    apiFetch('/plans'),

  getMySubscriptions: () =>
    apiFetch('/user/subscriptions'),

  purchasePlan: (data: { planId: string; messId?: string; startDate?: string }) =>
    apiFetch('/user/subscriptions', { method: 'POST', body: JSON.stringify(data) }),

  pauseSubscription: (subId: string) =>
    apiFetch(`/user/subscriptions/${subId}/pause`, { method: 'POST' }),

  resumeSubscription: (subId: string) =>
    apiFetch(`/user/subscriptions/${subId}/resume`, { method: 'POST' }),

  skipDate: (subId: string, date: string) =>
    apiFetch(`/user/subscriptions/${subId}/skip`, { method: 'POST', body: JSON.stringify({ date }) }),
};

// ---- Reviews ----

export const reviewApi = {
  submitReview: (orderId: string, data: { rating: number; reviewText?: string; tags?: string[] }) =>
    apiFetch(`/orders/${orderId}/review`, { method: 'POST', body: JSON.stringify(data) }),
};

// ---- Addresses ----

export const addressApi = {
  getAddresses: () =>
    apiFetch('/user/addresses'),

  addAddress: (data: { label: string; addressLine: string; area?: string; city: string; pincode: string; isDefault?: boolean }) =>
    apiFetch('/user/addresses', { method: 'POST', body: JSON.stringify(data) }),

  updateAddress: (id: string, data: any) =>
    apiFetch(`/user/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAddress: (id: string) =>
    apiFetch(`/user/addresses/${id}`, { method: 'DELETE' }),

  setDefault: (id: string) =>
    apiFetch(`/user/addresses/${id}/default`, { method: 'PATCH' }),
};

// ---- Favorites ----

export const favoriteApi = {
  getFavorites: () =>
    apiFetch('/favorites'),

  addFavorite: (messId: string) =>
    apiFetch(`/favorites/${messId}`, { method: 'POST' }),

  removeFavorite: (messId: string) =>
    apiFetch(`/favorites/${messId}`, { method: 'DELETE' }),
};

// ---- Coupons ----

export const couponApi = {
  validate: (code: string, orderAmount: number) =>
    apiFetch<{ valid: boolean; discount: number; message: string }>(
      '/coupons/validate',
      { method: 'POST', body: JSON.stringify({ code, orderAmount }) }
    ),
};

// ---- Notifications ----

export const notificationApi = {
  getNotifications: () =>
    apiFetch('/notifications'),

  markAsRead: (id: string) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),

  registerDevice: (token: string, deviceType: string) =>
    apiFetch('/notifications/register-device', { method: 'POST', body: JSON.stringify({ fcmToken: token, deviceType }) }),
};

// ---- Config / FAQs ----

export const configApi = {
  getFAQs: () =>
    apiFetch('/user/faqs').catch(() => ({ faqs: [] })),

  getCharges: () =>
    apiFetch('/config/charges').catch(() => ({ data: { delivery: 20, platform: 2 } })),
};
