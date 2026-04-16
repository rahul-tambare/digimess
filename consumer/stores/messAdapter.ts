// =============================================
// Data Adapters: Backend → Frontend interfaces
// =============================================
// The backend returns raw DB fields. The frontend UI expects
// a richer interface with computed/default fields.

export interface AdaptedMess {
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
  // Extra backend fields preserved
  description?: string;
  messType?: string;
  cuisines?: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  dinnerStartTime?: string;
  dinnerEndTime?: string;
  address?: string;
  city?: string;
  images?: string[];
}

export interface AdaptedThali {
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

/**
 * Adapt a backend Mess row → frontend Mess interface
 */
export function adaptMess(raw: any): AdaptedMess {
  const tags: string[] = [];
  if (raw.messType) tags.push(raw.messType);
  if (raw.cuisines) tags.push(...raw.cuisines.split(',').map((s: string) => s.trim()).filter(Boolean));
  if (raw.category) tags.push(raw.category);
  if (raw.deliveryAvailable) tags.push('Delivery');
  if (raw.takeAway) tags.push('Takeaway');
  if (raw.dineIn) tags.push('Dine-in');

  // Parse images array
  let images: string[] = [];
  if (raw.images) {
    if (typeof raw.images === 'string') {
      try { images = JSON.parse(raw.images); } catch { images = []; }
    } else if (Array.isArray(raw.images)) {
      images = raw.images;
    }
  }

  return {
    id: raw.id,
    name: raw.name || 'Unnamed Mess',
    type: (raw.messType || 'Veg').toLowerCase(),
    coverImage: images[0] || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop`,
    rating: raw.rating || 0,
    reviewCount: raw.reviewCount || 0,
    distanceKm: raw.distanceKm !== undefined ? parseFloat(Number(raw.distanceKm).toFixed(1)) : parseFloat((Math.random() * 4 + 0.5).toFixed(1)),
    deliveryTimeMin: raw.deliveryTimeMin || Math.floor(Math.random() * 20 + 20),
    priceRange: raw.priceRange || { min: 60, max: 150 },
    tags: tags.length > 0 ? tags : ['Home Food'],
    isOpen: Boolean(raw.isOpen),
    hasSubscription: Boolean(raw.hasSubscription),
    deliveryAvailable: Boolean(raw.deliveryAvailable),
    pickupAvailable: Boolean(raw.takeAway),
    // Preserve extra fields
    description: raw.description,
    messType: raw.messType,
    cuisines: raw.cuisines,
    lunchStartTime: raw.lunchStartTime,
    lunchEndTime: raw.lunchEndTime,
    dinnerStartTime: raw.dinnerStartTime,
    dinnerEndTime: raw.dinnerEndTime,
    address: raw.address || [raw.line1, raw.city].filter(Boolean).join(', '),
    city: raw.city,
    images,
  };
}

/**
 * Adapt a backend Thali row → frontend Thali interface
 */
export function adaptThali(raw: any): AdaptedThali {
  return {
    id: raw.id,
    messId: raw.messId,
    name: raw.name || 'Thali',
    mealTime: raw.mealTime || 'Lunch',
    type: raw.type || 'Veg',
    items: raw.itemsIncluded || raw.items || '',
    price: parseFloat(raw.price) || 0,
    discountedPrice: raw.discountedPrice ? parseFloat(raw.discountedPrice) : null,
    image: raw.image || `https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop`,
    available: raw.isAvailable !== undefined ? Boolean(raw.isAvailable) : true,
    isSpecial: Boolean(raw.isSpecial),
    rating: raw.rating || 4.0,
  };
}
