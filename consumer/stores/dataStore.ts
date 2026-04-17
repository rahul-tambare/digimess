// =============================================
// Consumer Data Store — API-Backed (Zustand)
// =============================================
// Replaces the old mock-data-driven stores with real API calls.
// Cart store remains client-side (no backend cart).

import { create } from 'zustand';
import { messApi, thaliApi, menuApi, orderApi, walletApi, subscriptionApi, userApi, favoriteApi, reviewApi } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { adaptMess, adaptThali, adaptItem, AdaptedItem } from './messAdapter';

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

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  messId: string;
  rating: number;
  reviewText: string;
  foodQuality: string | null;
  deliveryTime: string | null;
  createdAt: string;
  userName: string | null;
}

interface DataState {
  messes: Mess[];
  thalis: Thali[];
  items: AdaptedItem[];
  reviews: Review[];
  searchResults: Mess[];
  favorites: string[];
  currentMess: any | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;

  fetchMesses: (params?: any, page?: number) => Promise<void>;
  fetchThalis: (messId: string) => Promise<void>;
  searchMesses: (query: string) => Promise<void>;
  fetchMessDetail: (messId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (messId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  messes: [],
  thalis: [],
  items: [],
  reviews: [],
  searchResults: [],
  favorites: [],
  currentMess: null,
  loading: false,
  error: null,
  hasMore: true,

  fetchMesses: async (params = {}, page = 1) => {
    if (page === 1) set({ loading: true, error: null, hasMore: true });
    try {
      const location = useAuthStore.getState().user?.location;
      const combinedParams = location ? { ...params, lat: location.lat, lng: location.lng, page, limit: 10 } : { ...params, page, limit: 10 };
      const res = await messApi.listMesses(combinedParams);
      // Backend may return { messes: [...] } or just [...]
      const raw = Array.isArray(res) ? res : (res.messes || res.data || []);
      const newMesses = raw.map(adaptMess);
      
      set((state) => ({ 
        messes: page === 1 ? newMesses : [...state.messes, ...newMesses], 
        loading: false,
        hasMore: newMesses.length === 10
      }));
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
      set({ searchResults: messes, loading: false });
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
      
      const itemRes = await menuApi.getMessMenu(messId);
      const rawItems = Array.isArray(itemRes) ? itemRes : (itemRes.items || itemRes.data || []);
      
      let rawReviews: Review[] = [];
      try {
        const reviewRes = await reviewApi.getMessReviews(messId);
        rawReviews = Array.isArray(reviewRes) ? reviewRes : (reviewRes.reviews || reviewRes.data || []);
      } catch (err: any) {
        console.error('fetchMessReviews error:', err);
      }
      
      set({ 
        thalis: rawThalis.map(adaptThali),
        items: rawItems.map(adaptItem),
        reviews: rawReviews
      });
    } catch (err: any) {
      console.error('fetchMessDetail error:', err);
    }
  },

  fetchFavorites: async () => {
    try {
      const res: any = await favoriteApi.getFavorites();
      const raw = Array.isArray(res) ? res : (res.favorites || res.data || []);
      // Extract mess IDs from favorites list
      const favIds = raw.map((f: any) => f.messId || f.id || f);
      set({ favorites: favIds });
    } catch (err) {
      console.error('fetchFavorites error:', err);
    }
  },

  toggleFavorite: async (messId: string) => {
    const { favorites } = get();
    const isFav = favorites.includes(messId);
    
    // Optimistic UI update
    set({ favorites: isFav ? favorites.filter(id => id !== messId) : [...favorites, messId] });
    
    try {
      if (isFav) {
        await favoriteApi.removeFavorite(messId);
      } else {
        await favoriteApi.addFavorite(messId);
      }
    } catch (err) {
      // Revert on error
      console.error('toggleFavorite error:', err);
      set({ favorites });
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
  hasMoreOrders: boolean;

  fetchOrders: (filter?: string, page?: number) => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  placeOrder: (data: any) => Promise<string>;
  reorder: (orderId: string) => Promise<string>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  hasMoreOrders: true,

  fetchOrders: async (filter = 'All', page = 1) => {
    if (page === 1) set({ loading: true, hasMoreOrders: true });
    try {
      const res = await orderApi.getMyOrders({ filter, page, limit: 10 });
      const newOrders = Array.isArray(res) ? res : (res.orders || res.data || []);
      set((state) => ({
        orders: page === 1 ? newOrders : [...state.orders, ...newOrders],
        loading: false,
        hasMoreOrders: newOrders.length === 10
      }));
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
    const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Use totalAmountOverride (includes delivery + platform fees) if provided
    const totalAmount = data.totalAmountOverride != null ? data.totalAmountOverride : itemTotal;
    
    const { totalAmountOverride, ...restData } = data;
    const payload = {
      messId: cartState.messId,
      items,
      totalAmount,
      deliveryType: cartState.deliveryType,
      deliverySlot: cartState.deliverySlot,
      ...restData,
    };
    
    const res = await orderApi.placeOrder(payload);
    // Refresh local wallet state
    if (data.paymentMethod === 'wallet') {
      useWalletStore.getState().fetchBalance();
    }
    return res.id;
  },

  reorder: async (orderId: string) => {
    const res = await orderApi.reorder(orderId);
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
