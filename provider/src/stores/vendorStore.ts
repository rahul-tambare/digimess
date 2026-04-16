// ==========================================
// Vendor Store (Zustand)
// ==========================================

import { create } from 'zustand';
import type { Mess, Vendor, BankDetails } from '../types';
import { vendorApi, providerApi, messApi } from '../services/api';

interface VendorState {
  vendor: Vendor | null;
  mess: Mess | null;
  bankDetails: BankDetails | null;
  isVacationMode: boolean;
  loading: boolean;

  fetchVendorData: () => Promise<void>;
  updateVendor: (data: Partial<Vendor>) => Promise<void>;
  updateMess: (data: Partial<Mess>) => Promise<void>;
  toggleMessStatus: () => Promise<void>;
  setBankDetails: (details: BankDetails) => Promise<void>;
  setVacationMode: (mode: boolean) => Promise<void>;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendor: null,
  mess: null,
  bankDetails: null,
  isVacationMode: false,
  loading: false,

  fetchVendorData: async () => {
    set({ loading: true });
    try {
      // Run parallel API fetches to populate vendor state
      const [messesRes, bankRes] = await Promise.all([
        messApi.getMyMesses().catch(() => []),
        vendorApi.getBankDetails().catch(() => null)
      ]);
      
      const messes = Array.isArray(messesRes) ? messesRes : (messesRes.messes || messesRes.data || []);
      const mess = messes.length > 0 ? messes[0] : null;

      // Ensure proper fallback
      set({ mess, loading: false, bankDetails: bankRes || null });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  updateVendor: async (data) => {
    // Requires updating profile API in providerApi
    await providerApi.updateProfile(data);
    get().fetchVendorData();
  },

  updateMess: async (data) => {
    const { mess } = get();
    if (!mess) return;
    await messApi.updateMess(mess.id, data);
    get().fetchVendorData();
  },

  toggleMessStatus: async () => {
    try {
      await providerApi.toggleMess();
      get().fetchVendorData();
    } catch (e) {
      console.error("toggle mess status error:", e);
    }
  },

  setBankDetails: async (details) => {
    const { bankDetails } = get();
    if (bankDetails && Object.keys(bankDetails).length > 0) {
      await vendorApi.updateBankDetails(details);
    } else {
      await vendorApi.createBankDetails(details);
    }
    get().fetchVendorData();
  },

  setVacationMode: async (mode) => {
    set({ isVacationMode: mode });
  },
}));
