// =============================================
// Consumer Data Store — API-Backed (Zustand)
// =============================================
// Replaces the old mock-data-driven stores with real API calls.
// Cart store remains client-side (no backend cart).

import { create } from 'zustand';
import { messApi, thaliApi, orderApi, walletApi, subscriptionApi, userApi, favoriteApi } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { adaptMess, adaptThali } from './messAdapter';

// Re-export auth store so existing imports still work
export { useAuthStore as useUserStore } from '../services/authStore';

// ─────────────────────────────────────────────
// Data Store — Messes & Thalis (API-backed)
// ─────────────────────────────────────────────

interface Mess {
  id: string;
  name: string;
  type: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  deliveryTimeMin: number;
  priceRange: { min: number; max: number };
  tags: string[];
  isOpen: boolean;
  hasSubscription: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
}

interface Thali {
  id: string;
  messId: string;
  name: string;
  mealTime: string;
  type: string;
  items: string;
  price: number;
  discountedPrice: number | null;
  image: string;
  available: boolean;
  isSpecial: boolean;
  rating: number;
}

interface DataState {
  messes: Mess[];
  thalis: Thali[];
  currentMess: any | null;
  loading: boolean;
  error: string | null;

  fetchMesses: (params?: any) => Promise<void>;
  fetchThalis: (messId: string) => Promise<void>;
  searchMesses: (query: string) => Promise<void>;
  fetchMessDetail: (messId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  messes: [],
  thalis: [],
  currentMess: null,
  loading: false,
  error: null,

  fetchMesses: async (params) => {
    set({ loading: true, error: null });
    try {
      const location = useAuthStore.getState().user?.location;
      const combinedParams = location ? { ...params, lat: location.lat, lng: location.lng } : params;
      const res = await messApi.listMesses(combinedParams);
      // Backend may return { messes: [...] } or just [...]
      const raw = Array.isArray(res) ? res : (res.messes || res.data || []);
      const messes = raw.map(adaptMess);
      set({ messes, loading: false });
    } catch (err: any) {
      console.error('fetchMesses error:', err);
      set({ error: err.message, loading: false });
    }
  },

  fetchThalis: async (messId) => {
    try {
      const res = await thaliApi.getMessThalis(messId);
      const raw = Array.isArray(res) ? res : (res.thalis || res.data || []);
      const thalis = raw.map(adaptThali);
      set({ thalis });
    } catch (err: any) {
      console.error('fetchThalis error:', err);
    }
  },

  searchMesses: async (query) => {
    set({ loading: true, error: null });
    try {
      const location = useAuthStore.getState().user?.location;
      const res = await messApi.searchMesses(query, location?.lat, location?.lng);
      const raw = Array.isArray(res) ? res : (res.messes || res.data || []);
      const messes = raw.map(adaptMess);
      set({ messes, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMessDetail: async (messId: string) => {
    try {
      const location = useAuthStore.getState().user?.location;
      const res = await messApi.getMessDetail(messId, location?.lat, location?.lng);
      const mess = adaptMess(res);
      set((state: any) => {
        const exists = state.messes.find((m: any) => m.id === messId);
        const messes = exists
          ? state.messes.map((m: any) => m.id === messId ? mess : m)
          : [...state.messes, mess];
        return { messes, currentMess: mess };
      });
      const thaliRes = await thaliApi.getMessThalis(messId);
      const rawThalis = Array.isArray(thaliRes) ? thaliRes : (thaliRes.thalis || thaliRes.data || []);
      set({ thalis: rawThalis.map(adaptThali) });
    } catch (err: any) {
      console.error('fetchMessDetail error:', err);
    }
  },
}));

// ─────────────────────────────────────────────
// Cart Store — Client-side only (unchanged)
// ─────────────────────────────────────────────

interface CartItem {
  thaliId: string;
  name: string;
  qty: number;
  price: number;
  customisation?: any;
}

interface CartState {
  messId: string | null;
  messName: string | null;
  items: CartItem[];
  deliveryType: string;
  deliverySlot: string | null;
  addToCart: (messId: string, messName: string, item: CartItem) => void;
  removeFromCart: (thaliId: string) => void;
  incrementQuantity: (thaliId: string) => void;
  decrementQuantity: (thaliId: string) => void;
  setDeliveryType: (type: string) => void;
  setDeliverySlot: (slot: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  messId: null,
  messName: null,
  items: [],
  deliveryType: 'delivery',
  deliverySlot: null,

  addToCart: (messId, messName, item) =>
    set((state) => {
      if (state.messId && state.messId !== messId) {
        throw new Error('MULTIPLE_MESS_ERROR');
      }
      const existingItem = state.items.find(i => i.thaliId === item.thaliId);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(i =>
            i.thaliId === item.thaliId ? { ...i, qty: i.qty + item.qty } : i
          )
        };
      }
      return { messId, messName, items: [...state.items, item] };
    }),

  removeFromCart: (thaliId) =>
    set((state) => {
      const remainingItems = state.items.filter(i => i.thaliId !== thaliId);
      return {
        ...state,
        items: remainingItems,
        messId: remainingItems.length === 0 ? null : state.messId,
        messName: remainingItems.length === 0 ? null : state.messName,
      };
    }),

  incrementQuantity: (thaliId) =>
    set((state) => ({
      items: state.items.map(i => i.thaliId === thaliId ? { ...i, qty: i.qty + 1 } : i)
    })),

  decrementQuantity: (thaliId) =>
    set((state) => {
      const items = state.items.map(i => i.thaliId === thaliId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
      return {
        ...state,
        items,
        messId: items.length === 0 ? null : state.messId,
        messName: items.length === 0 ? null : state.messName,
      };
    }),

  setDeliveryType: (type) => set({ deliveryType: type }),
  setDeliverySlot: (slot) => set({ deliverySlot: slot }),

  clearCart: () => set({ messId: null, messName: null, items: [], deliveryType: 'delivery', deliverySlot: null }),

  getTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  }
}));

// ─────────────────────────────────────────────
// Order Store — API-backed
// ─────────────────────────────────────────────

interface OrderState {
  orders: any[];
  currentOrder: any | null;
  loading: boolean;

  fetchOrders: () => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  placeOrder: (data: any) => Promise<string>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const res = await orderApi.getMyOrders();
      const orders = Array.isArray(res) ? res : (res.orders || res.data || []);
      set({ orders, loading: false });
    } catch (err: any) {
      console.error('fetchOrders error:', err);
      set({ loading: false });
    }
  },

  fetchOrderDetail: async (orderId) => {
    try {
      const res = await orderApi.getOrderDetail(orderId);
      set({ currentOrder: res.order || res });
    } catch (err: any) {
      console.error('fetchOrderDetail error:', err);
    }
  },

  placeOrder: async (data: any) => {
    // Gather logic
    const cartState = useCartStore.getState();
    const items = cartState.items.map(i => ({ thaliId: i.thaliId, name: i.name, quantity: i.qty, price: i.price, ...i.customisation }));
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const payload = {
      messId: cartState.messId,
      items,
      totalAmount,
      deliveryType: cartState.deliveryType,
      deliverySlot: cartState.deliverySlot,
      ...data,
    };
    
    const res = await orderApi.placeOrder(payload);
    // Refresh local wallet state
    useWalletStore.getState().fetchBalance();
    return res.id;
  },
}));

// ─────────────────────────────────────────────
// Wallet Store — API-backed
// ─────────────────────────────────────────────

interface WalletState {
  balance: number;
  transactions: any[];
  loading: boolean;

  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  transactions: [],
  loading: false,

  fetchBalance: async () => {
    try {
      const res = await walletApi.getBalance();
      set({ balance: res.balance ?? res });
    } catch (err: any) {
      console.error('fetchBalance error:', err);
      set({ balance: 0 }); // Fallback
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ loading: true });
    try {
      const res = await walletApi.getTransactions(page);
      const transactions = Array.isArray(res) ? res : (res.transactions || res.data || []);
      set({ transactions, loading: false });
    } catch (err: any) {
      console.error('fetchTransactions error:', err);
      set({ loading: false });
    }
  },
}));

// ─────────────────────────────────────────────
// Subscription Store — API-backed
// ─────────────────────────────────────────────

interface SubscriptionState {
  plans: any[];
  subscriptions: any[];
  loading: boolean;

  fetchPlans: () => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  purchasePlan: (planId: string, messId?: string) => Promise<void>;
  pauseSubscription: (subId: string) => Promise<void>;
  resumeSubscription: (subId: string) => Promise<void>;
  skipDate: (subId: string, date: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plans: [],
  subscriptions: [],
  loading: false,

  fetchPlans: async () => {
    set({ loading: true });
    try {
      const res = await subscriptionApi.getPlans();
      const plans = Array.isArray(res) ? res : (res.plans || res.data || []);
      set({ plans, loading: false });
    } catch (err: any) {
      console.error('fetchPlans error:', err);
      set({ loading: false });
    }
  },

  fetchSubscriptions: async () => {
    set({ loading: true });
    try {
      const res = await subscriptionApi.getMySubscriptions();
      const subscriptions = Array.isArray(res) ? res : (res.subscriptions || res.data || []);
      set({ subscriptions, loading: false });
    } catch (err: any) {
      console.error('fetchSubscriptions error:', err);
      set({ loading: false });
    }
  },

  purchasePlan: async (planId, messId) => {
    await subscriptionApi.purchasePlan({ planId, messId });
    // Refresh subscriptions after purchase
    get().fetchSubscriptions();
  },

  pauseSubscription: async (subId) => {
    await subscriptionApi.pauseSubscription(subId);
    get().fetchSubscriptions();
  },

  resumeSubscription: async (subId) => {
    await subscriptionApi.resumeSubscription(subId);
    get().fetchSubscriptions();
  },

  skipDate: async (subId, date) => {
    await subscriptionApi.skipDate(subId, date);
  },
}));
