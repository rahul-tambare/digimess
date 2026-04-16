// ==========================================
// Order Store (Zustand)
// ==========================================

import { create } from 'zustand';
import type { Order, OrderStatus } from '../types';
import { orderApi } from '../services/api';

type FilterTab = 'all' | 'new' | 'preparing' | 'delivered' | 'cancelled';

interface OrderState {
  orders: Order[];
  activeFilter: FilterTab;
  selectedOrderId: string | null;
  loading: boolean;

  setFilter: (filter: FilterTab) => void;
  selectOrder: (id: string | null) => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getFilteredOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
  getNewOrdersCount: () => number;
  getTodaysOrdersCount: () => number;
  getTodaysEarnings: () => number;
  getPendingOrdersCount: () => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeFilter: 'all',
  selectedOrderId: null,
  loading: false,

  setFilter: (filter) => set({ activeFilter: filter }),
  selectOrder: (id) => set({ selectedOrderId: id }),

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const res = await orderApi.getProviderOrders();
      const orders = Array.isArray(res) ? res : (res.orders || res.data || []);
      set({ orders, loading: false });
    } catch (error) {
      console.error('fetchOrders error:', error);
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      // Optimistic update locally
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId
            ? {
                ...order,
                status,
                statusTimeline: [
                  ...order.statusTimeline,
                  { status, timestamp: new Date().toISOString() },
                ],
                ...(status === 'accepted' ? { acceptedAt: new Date().toISOString() } : {}),
                ...(status === 'preparing' ? { preparedAt: new Date().toISOString() } : {}),
                ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}),
                ...(status === 'cancelled' || status === 'rejected' ? { cancelledAt: new Date().toISOString() } : {}),
              }
            : order
        ),
      }));

      // Update in backend
      await orderApi.updateOrderStatus(orderId, status);
    } catch (e) {
      console.error('updateOrderStatus error:', e);
      // Re-fetch orders to revert optimistic update on failure
      get().fetchOrders();
    }
  },

  getFilteredOrders: () => {
    const { orders, activeFilter } = get();
    if (activeFilter === 'all') return orders;
    if (activeFilter === 'new') return orders.filter(o => o.status === 'pending');
    if (activeFilter === 'preparing') return orders.filter(o => ['accepted', 'preparing', 'out_for_delivery'].includes(o.status));
    if (activeFilter === 'delivered') return orders.filter(o => o.status === 'delivered');
    if (activeFilter === 'cancelled') return orders.filter(o => ['cancelled', 'rejected'].includes(o.status));
    return orders;
  },

  getOrderById: (id) => get().orders.find(o => o.id === id),
  getNewOrdersCount: () => get().orders.filter(o => o.status === 'pending').length,
  getTodaysOrdersCount: () => get().orders.length,
  getTodaysEarnings: () => get().orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0),
  getPendingOrdersCount: () => get().orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).length,
}));
