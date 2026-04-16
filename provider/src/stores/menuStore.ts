// ==========================================
// Menu Store (Zustand)
// ==========================================

import { create } from 'zustand';
import type { Thali, MenuItem } from '../types';
import { thaliApi, menuApi } from '../services/api';
import { useVendorStore } from './vendorStore';

interface MenuState {
  thalis: Thali[];
  menuItems: MenuItem[];
  loading: boolean;

  fetchMenuData: () => Promise<void>;
  addThali: (thali: Omit<Thali, 'id' | 'messId'>) => Promise<void>;
  updateThali: (id: string, data: Partial<Thali>) => Promise<void>;
  deleteThali: (id: string) => Promise<void>;
  toggleThaliAvailability: (id: string) => Promise<void>;
  toggleDailySpecial: (id: string) => Promise<void>;

  addMenuItem: (item: Omit<MenuItem, 'id' | 'messId'>) => Promise<void>;
  updateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  toggleMenuItemAvailability: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  thalis: [],
  menuItems: [],
  loading: false,

  fetchMenuData: async () => {
    const mess = useVendorStore.getState().mess;
    if (!mess) return;
    
    set({ loading: true });
    try {
      const [thalisRes, menuItemsRes] = await Promise.all([
        thaliApi.getMessThalis(mess.id).catch(() => []),
        menuApi.getMessMenu(mess.id).catch(() => [])
      ]);
      const thalis = Array.isArray(thalisRes) ? thalisRes : (thalisRes.thalis || thalisRes.data || []);
      const menuItems = Array.isArray(menuItemsRes) ? menuItemsRes : (menuItemsRes.menuItems || menuItemsRes.data || []);
      set({ thalis, menuItems, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  addThali: async (thali) => {
    const mess = useVendorStore.getState().mess;
    if (!mess) return;
    // @ts-ignore
    await thaliApi.addThali({ ...thali, messId: mess.id });
    get().fetchMenuData();
  },

  updateThali: async (id, data) => {
    await thaliApi.updateThali(id, data);
    get().fetchMenuData();
  },

  deleteThali: async (id) => {
    await thaliApi.deleteThali(id);
    get().fetchMenuData();
  },

  toggleThaliAvailability: async (id) => {
    await thaliApi.toggleAvailability(id);
    get().fetchMenuData();
  },

  toggleDailySpecial: async (id) => {
    await thaliApi.toggleSpecial(id);
    get().fetchMenuData();
  },

  addMenuItem: async (item) => {
    const mess = useVendorStore.getState().mess;
    if (!mess) return;
    // @ts-ignore
    await menuApi.addMenuItem({ ...item, itemName: item.name, messId: mess.id });
    get().fetchMenuData();
  },

  updateMenuItem: async (id, data) => {
    await menuApi.updateMenuItem(id, data);
    get().fetchMenuData();
  },

  deleteMenuItem: async (id) => {
    await menuApi.deleteMenuItem(id);
    get().fetchMenuData();
  },

  toggleMenuItemAvailability: async (id) => {
    // Backend doesn't have a specific toggle menu item route, usually handled via update
    const item = get().menuItems.find(m => m.id === id);
    if (!item) return;
    await menuApi.updateMenuItem(id, { isAvailable: !item.isAvailable });
    get().fetchMenuData();
  },
}));
