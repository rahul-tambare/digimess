// ==========================================
// Zod Validation Schemas
// ==========================================

import { z } from 'zod';

export const phoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number');

export const otpSchema = z.string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

export const vendorDetailsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid phone'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  dateOfBirth: z.string().optional(),
  profilePhoto: z.string().optional(),
  governmentIdType: z.enum(['Aadhaar', 'PAN', 'Voter ID', 'Driving License']).optional(),
  governmentIdNumber: z.string().optional(),
});

export const messInfoSchema = z.object({
  name: z.string().min(3, 'Mess name must be at least 3 characters'),
  messType: z.enum(['Veg', 'Non-Veg', 'Both']),
  tagline: z.string().max(150, 'Max 150 characters').optional().or(z.literal('')),
  description: z.string().min(10, 'At least 10 characters').max(500, 'Max 500 characters'),
  seatingCapacity: z.number().min(0),
  maxDailyOrders: z.number().min(1, 'At least 1 order capacity'),
  establishmentYear: z.number().optional(),
  fssaiLicense: z.string().optional().or(z.literal('')),
});

export const addressSchema = z.object({
  line1: z.string().min(3, 'Address is required'),
  line2: z.string().optional().or(z.literal('')),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be 6-digit pincode'),
  landmark: z.string().optional().or(z.literal('')),
  deliveryRadius: z.number().min(0).max(15),
});

export const operatingSchema = z.object({
  operatingDays: z.array(z.string()).min(1, 'Select at least 1 day'),
  openingTime: z.string().min(1, 'Required'),
  closingTime: z.string().min(1, 'Required'),
  breakfastEnabled: z.boolean(),
  breakfastStart: z.string().optional(),
  breakfastEnd: z.string().optional(),
  lunchEnabled: z.boolean(),
  lunchStart: z.string().optional(),
  lunchEnd: z.string().optional(),
  dinnerEnabled: z.boolean(),
  dinnerStart: z.string().optional(),
  dinnerEnd: z.string().optional(),
});

export const serviceSchema = z.object({
  deliveryAvailable: z.boolean(),
  deliveryCharge: z.number().optional(),
  freeDeliveryAbove: z.number().optional(),
  selfPickup: z.boolean(),
  dineIn: z.boolean(),
  preBookingRequired: z.boolean(),
  subscriptionPlans: z.boolean(),
  packagingType: z.enum(['Disposable', 'Steel Tiffin', 'Both']),
  dietaryOptions: z.array(z.string()),
});

export const menuItemSchema = z.object({
  category: z.enum(['Roti', 'Rice', 'Dal', 'Sabzi', 'Snack', 'Beverage', 'Dessert', 'Other']),
  name: z.string().min(2, 'Item name required'),
  description: z.string().max(100).optional().or(z.literal('')),
  price: z.number().min(1, 'Price must be at least ₹1'),
  isVeg: z.boolean(),
  availableDays: z.array(z.string()),
  portionSize: z.enum(['Small', 'Regular', 'Large', 'Full']),
  image: z.string().optional().or(z.literal('')),
});

export const thaliSchema = z.object({
  name: z.string().min(3, 'Thali name required'),
  mealTime: z.enum(['Breakfast', 'Lunch', 'Dinner', 'All Day']),
  type: z.enum(['Veg', 'Non-Veg', 'Jain']),
  itemsIncluded: z.string().min(5, 'List the items included'),
  price: z.number().min(1, 'Price must be at least ₹1'),
  discountedPrice: z.number().optional(),
  description: z.string().optional().or(z.literal('')),
  availableDays: z.array(z.string()),
  maxQtyPerDay: z.number().optional(),
  image: z.string().optional().or(z.literal('')),
  isSubscriptionThali: z.boolean(),
});

export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(3, 'Name required'),
  accountNumber: z.string().min(8, 'Invalid account number').max(18),
  confirmAccountNumber: z.string(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  upiId: z.string().optional().or(z.literal('')),
}).refine(data => data.accountNumber === data.confirmAccountNumber, {
  message: 'Account numbers do not match',
  path: ['confirmAccountNumber'],
});
