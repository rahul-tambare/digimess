// ==========================================
// Onboarding Store (Zustand)
// ==========================================

import { create } from 'zustand';
import type { OnboardingData, MenuItem, Thali } from '../types';
import { vendorApi, messApi, menuApi, thaliApi } from '../services/api';

const initialData: OnboardingData = {
  step: 1,
  vendor: {},
  mess: {},
  address: { deliveryRadius: 5 },
  operating: {
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openingTime: '07:00',
    closingTime: '22:00',
    meals: {
      breakfast: { enabled: true, startTime: '07:00', endTime: '10:00' },
      lunch: { enabled: true, startTime: '12:00', endTime: '15:00' },
      dinner: { enabled: true, startTime: '19:00', endTime: '22:00' },
    },
  },
  services: {
    deliveryAvailable: false,
    selfPickup: true,
    dineIn: false,
    preBookingRequired: false,
    subscriptionPlans: false,
    packagingType: 'Disposable',
    dietaryOptions: [],
  },
  menuItems: [],
  thalis: [],
  bankDetails: {},
  media: { galleryPhotos: [], foodPhotos: [] },
  termsAccepted: false,
  privacyAccepted: false,
};

interface OnboardingState {
  data: OnboardingData;
  isDraft: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateVendor: (vendor: Partial<OnboardingData['vendor']>) => void;
  updateMess: (mess: Partial<OnboardingData['mess']>) => void;
  updateAddress: (address: Partial<OnboardingData['address']>) => void;
  updateOperating: (operating: Partial<OnboardingData['operating']>) => void;
  updateServices: (services: Partial<OnboardingData['services']>) => void;
  addMenuItem: (item: Partial<MenuItem>) => void;
  updateMenuItem: (index: number, item: Partial<MenuItem>) => void;
  removeMenuItem: (index: number) => void;
  addThali: (thali: Partial<Thali>) => void;
  updateThali: (index: number, thali: Partial<Thali>) => void;
  removeThali: (index: number) => void;
  updateBankDetails: (bank: Partial<OnboardingData['bankDetails']>) => void;
  updateMedia: (media: Partial<OnboardingData['media']>) => void;
  setTerms: (accepted: boolean) => void;
  setPrivacy: (accepted: boolean) => void;
  saveDraft: () => void;
  resetOnboarding: () => void;
  submitOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: initialData,
  isDraft: false,

  setStep: (step) => set((state) => ({ data: { ...state.data, step } })),
  nextStep: () => set((state) => ({ data: { ...state.data, step: Math.min(state.data.step + 1, 10) } })),
  prevStep: () => set((state) => ({ data: { ...state.data, step: Math.max(state.data.step - 1, 1) } })),

  updateVendor: (vendor) => set((state) => ({
    data: { ...state.data, vendor: { ...state.data.vendor, ...vendor } },
  })),

  updateMess: (mess) => set((state) => ({
    data: { ...state.data, mess: { ...state.data.mess, ...mess } },
  })),

  updateAddress: (address) => set((state) => ({
    data: { ...state.data, address: { ...state.data.address, ...address } },
  })),

  updateOperating: (operating) => set((state) => ({
    data: { ...state.data, operating: { ...state.data.operating, ...operating } },
  })),

  updateServices: (services) => set((state) => ({
    data: { ...state.data, services: { ...state.data.services, ...services } },
  })),

  addMenuItem: (item) => set((state) => ({
    data: { ...state.data, menuItems: [...state.data.menuItems, item] },
  })),

  updateMenuItem: (index, item) => set((state) => {
    const items = [...state.data.menuItems];
    items[index] = { ...items[index], ...item };
    return { data: { ...state.data, menuItems: items } };
  }),

  removeMenuItem: (index) => set((state) => ({
    data: { ...state.data, menuItems: state.data.menuItems.filter((_, i) => i !== index) },
  })),

  addThali: (thali) => set((state) => ({
    data: { ...state.data, thalis: [...state.data.thalis, thali] },
  })),

  updateThali: (index, thali) => set((state) => {
    const items = [...state.data.thalis];
    items[index] = { ...items[index], ...thali };
    return { data: { ...state.data, thalis: items } };
  }),

  removeThali: (index) => set((state) => ({
    data: { ...state.data, thalis: state.data.thalis.filter((_, i) => i !== index) },
  })),

  updateBankDetails: (bank) => set((state) => ({
    data: { ...state.data, bankDetails: { ...state.data.bankDetails, ...bank } },
  })),

  updateMedia: (media) => set((state) => ({
    data: { ...state.data, media: { ...state.data.media, ...media } },
  })),

  setTerms: (accepted) => set((state) => ({
    data: { ...state.data, termsAccepted: accepted },
  })),

  setPrivacy: (accepted) => set((state) => ({
    data: { ...state.data, privacyAccepted: accepted },
  })),

  saveDraft: () => set({ isDraft: true }),

  resetOnboarding: () => set({ data: initialData, isDraft: false }),

  submitOnboarding: async () => {
    try {
      const { data } = get();
      // 1. Submit Bank Details
      if (data.bankDetails && data.bankDetails.accountNumber) {
        try {
          // @ts-ignore
          await vendorApi.createBankDetails(data.bankDetails);
        } catch (bankErr: any) {
          if (bankErr.message?.includes('already exist') || bankErr.message?.includes('Use PUT')) {
            try {
              // @ts-ignore
              await vendorApi.updateBankDetails(data.bankDetails);
            } catch (updateErr: any) {
              console.warn('Fallback updateBankDetails failed', updateErr);
            }
          }
        }
      }
      
      // 2. Submit Mess Data
      const messPayload = {
        name: data.mess.name,
        description: data.mess.description,
        messType: data.mess.messType,
        deliveryAvailable: data.services.deliveryAvailable,
        dineIn: data.services.dineIn,
        takeAway: data.services.selfPickup,
        deliveryRadius: data.address.deliveryRadius,
        line1: data.address.line1,
        line2: data.address.line2,
        city: data.address.city,
        state: data.address.state,
        pincode: data.address.pincode,
        latitude: data.address.latitude,
        longitude: data.address.longitude,
      };
      // @ts-ignore
      const messResult = await messApi.registerMess(messPayload);
      const messId = messResult?.id;

      if (messId) {
        // 3. Submit Menu Items
        for (const item of data.menuItems) {
          if (item.name && item.price) {
            try {
              await menuApi.addMenuItem({
                messId,
                itemName: item.name || '',
                price: item.price || 0,
                isVeg: item.isVeg ?? true,
                category: item.category || 'Other',
              });
            } catch (e) {
              console.warn('Failed to add menu item:', item.name, e);
            }
          }
        }

        // 4. Submit Thalis
        for (const thali of data.thalis) {
          if (thali.name && thali.price) {
            try {
              await thaliApi.addThali({
                messId,
                name: thali.name || '',
                mealTime: thali.mealTime || 'Lunch',
                type: thali.type || 'Veg',
                itemsIncluded: thali.itemsIncluded || '',
                price: thali.price || 0,
                discountedPrice: thali.discountedPrice,
              });
            } catch (e) {
              console.warn('Failed to add thali:', thali.name, e);
            }
          }
        }
      }

      console.log('Onboarding successfully completed');
    } catch (e: any) {
      console.error('Submit onboarding error', e);
      throw e;
    }
  },
}));
