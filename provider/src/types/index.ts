// ==========================================
// Mess Provider App — TypeScript Interfaces
// ==========================================

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  profilePhoto?: string;
  governmentIdType?: 'Aadhaar' | 'PAN' | 'Voter ID' | 'Driving License';
  governmentIdNumber?: string;
  governmentIdPhotos?: string[];
  isVerified: boolean;
  role: 'vendor';
}

export interface Mess {
  id: string;
  vendorId: string;
  name: string;
  messType: 'Veg' | 'Non-Veg' | 'Both';
  tagline?: string;
  description: string;
  seatingCapacity: number;
  maxDailyOrders: number;
  establishmentYear?: number;
  fssaiLicense?: string;
  isOpen: boolean;
  isApproved: boolean;
  rating: number;
  totalOrders: number;
  address?: MessAddress;
  operatingDetails?: OperatingDetails;
  serviceOptions?: ServiceOptions;
  images?: MessImages;
  createdAt: string;
}

export interface MessAddress {
  line1: string;
  line2?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadius: number;
}

export interface OperatingDetails {
  operatingDays: string[];
  openingTime: string;
  closingTime: string;
  meals: {
    breakfast: { enabled: boolean; startTime: string; endTime: string };
    lunch: { enabled: boolean; startTime: string; endTime: string };
    dinner: { enabled: boolean; startTime: string; endTime: string };
  };
  advanceCutoffTime?: string;
  holidayDates?: string[];
}

export interface ServiceOptions {
  deliveryAvailable: boolean;
  deliveryCharge?: number;
  freeDeliveryAbove?: number;
  selfPickup: boolean;
  dineIn: boolean;
  preBookingRequired: boolean;
  subscriptionPlans: boolean;
  packagingType: 'Disposable' | 'Steel Tiffin' | 'Both';
  dietaryOptions: string[];
}

export interface MessImages {
  coverImage?: string;
  galleryPhotos: string[];
  foodPhotos: string[];
  videoUrl?: string;
  menuCardImage?: string;
}

export interface MenuItem {
  id: string;
  messId: string;
  category: 'Roti' | 'Rice' | 'Dal' | 'Sabzi' | 'Snack' | 'Beverage' | 'Dessert' | 'Other';
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  availableDays: string[];
  portionSize: 'Small' | 'Regular' | 'Large' | 'Full';
  image?: string;
  isAvailable: boolean;
}

export interface Thali {
  id: string;
  messId: string;
  name: string;
  mealTime: 'Breakfast' | 'Lunch' | 'Dinner' | 'All Day';
  type: 'Veg' | 'Non-Veg' | 'Jain';
  itemsIncluded: string;
  numberOfItems?: number;
  price: number;
  discountedPrice?: number;
  description?: string;
  availableDays: string[];
  maxQtyPerDay?: number;
  image?: string;
  isSubscriptionThali: boolean;
  isAvailable: boolean;
  isSpecial: boolean;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branchName?: string;
  upiId?: string;
  upiQrCode?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  messId: string;
  items: OrderItem[];
  mealTime: 'Breakfast' | 'Lunch' | 'Dinner';
  deliveryType: 'delivery' | 'pickup' | 'dine-in';
  status: OrderStatus;
  amount: number;
  deliveryCharge?: number;
  discount?: number;
  gst?: number;
  totalAmount: number;
  address?: string;
  specialNote?: string;
  placedAt: string;
  requestedBy: string;
  acceptedAt?: string;
  preparedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  statusTimeline: StatusTimelineEntry[];
}

export type OrderStatus = 'pending' | 'accepted' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rejected';

export interface OrderItem {
  thaliId?: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface StatusTimelineEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  date: string;
  customerName: string;
  amount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
}

export interface Payout {
  id: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Processing';
}

export interface EarningsSummary {
  totalLifetime: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  totalOrdersFulfilled: number;
}

export interface OnboardingData {
  step: number;
  vendor: Partial<Vendor>;
  mess: Partial<Mess>;
  address: Partial<MessAddress>;
  operating: Partial<OperatingDetails>;
  services: Partial<ServiceOptions>;
  menuItems: Partial<MenuItem>[];
  thalis: Partial<Thali>[];
  bankDetails: Partial<BankDetails>;
  media: Partial<MessImages>;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}
