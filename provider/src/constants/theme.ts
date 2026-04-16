// ==========================================
// Design System — Colors, Typography, Spacing
// ==========================================

export const Colors = {
  // Primary palette
  primary: '#FF6B35',
  primaryLight: '#FF8A5C',
  primaryDark: '#E55A2B',
  primaryBg: 'rgba(255, 107, 53, 0.08)',
  primaryBg2: 'rgba(255, 107, 53, 0.15)',

  // Accent
  accent: '#2D6A4F',
  accentLight: '#40916C',
  accentBg: 'rgba(45, 106, 79, 0.08)',

  // Status colors
  success: '#10B981',
  successBg: '#ECFDF5',
  successDark: '#059669',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningDark: '#D97706',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  errorDark: '#DC2626',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  infoDark: '#2563EB',

  // Order status
  statusNew: '#F59E0B',
  statusAccepted: '#3B82F6',
  statusPreparing: '#8B5CF6',
  statusOutForDelivery: '#06B6D4',
  statusDelivered: '#10B981',
  statusCompleted: '#059669',
  statusRejected: '#EF4444',
  statusCancelled: '#6B7280',

  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#3B82F6',

  // Dark surfaces (for premium cards)
  darkSurface: '#1E293B',
  darkSurfaceLight: '#334155',
  darkText: '#E2E8F0',
  darkTextSecondary: '#94A3B8',

  // Veg / Non-veg indicators
  veg: '#22C55E',
  nonVeg: '#EF4444',

  // Meal time colors
  breakfast: '#F97316',
  lunch: '#EAB308',
  dinner: '#8B5CF6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const StatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  new: { color: Colors.statusNew, bg: Colors.warningBg, label: 'New' },
  accepted: { color: Colors.statusAccepted, bg: Colors.infoBg, label: 'Accepted' },
  preparing: { color: Colors.statusPreparing, bg: '#F5F3FF', label: 'Preparing' },
  out_for_delivery: { color: Colors.statusOutForDelivery, bg: '#ECFEFF', label: 'Out for Delivery' },
  delivered: { color: Colors.statusDelivered, bg: Colors.successBg, label: 'Delivered' },
  completed: { color: Colors.statusCompleted, bg: Colors.successBg, label: 'Completed' },
  rejected: { color: Colors.statusRejected, bg: Colors.errorBg, label: 'Rejected' },
  cancelled: { color: Colors.statusCancelled, bg: '#F3F4F6', label: 'Cancelled' },
  pending: { color: Colors.statusNew, bg: Colors.warningBg, label: 'Pending' },
  confirmed: { color: Colors.statusAccepted, bg: Colors.infoBg, label: 'Confirmed' },
};
