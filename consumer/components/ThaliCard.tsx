import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';

export interface ThaliCardProps {
  id: string;
  name: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | string;
  type: 'veg' | 'non-veg';
  items: string;
  price: number;
  discountedPrice?: number | null;
  image: string;
  available: boolean;
  isSpecial?: boolean;
  rating?: number;
  quantity?: number;
  isSubscriptionThali?: boolean;
  subscriptionExtraCharge?: number;
  onAdd: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  messId?: string;
}

export function ThaliCard({
  name, mealTime, type, items, price, discountedPrice, image,
  available, isSpecial, rating, quantity = 0, isSubscriptionThali, subscriptionExtraCharge, onAdd, onIncrement, onDecrement,
}: ThaliCardProps) {
  return (
    <View style={[s.card, !available && { opacity: 0.5 }]}>
      <View style={s.row}>
        {/* Info */}
        <View style={s.info}>
          <View style={s.badges}>
            <View style={[s.vegDot, { backgroundColor: type === 'veg' ? '#22C55E' : '#EF4444' }]} />
            {isSpecial && (
              <View style={s.specialBadge}>
                <Text style={s.specialText}>⭐ Special</Text>
              </View>
            )}
          </View>
          <Text style={s.name}>{name}</Text>
          <Text style={s.items} numberOfLines={2}>{items}</Text>
          <View style={s.priceRow}>
            {discountedPrice ? (
              <>
                <Text style={s.price}>₹{discountedPrice}</Text>
                <Text style={s.oldPrice}>₹{price}</Text>
              </>
            ) : (
              <Text style={s.price}>₹{price}</Text>
            )}
            {isSubscriptionThali && (
              <View style={s.subBadge}>
                <Text style={s.subText}>🎫 Sub Eligible</Text>
                {!!subscriptionExtraCharge && <Text style={s.subExtra}>+₹{subscriptionExtraCharge}</Text>}
              </View>
            )}
          </View>
        </View>

        {/* Image + Button */}
        <View style={s.imageCol}>
          <Image source={{ uri: image }} style={s.image} resizeMode="cover" />
          <View style={s.addWrap}>
            {!available ? (
              <View style={s.unavailableBtn}>
                <Text style={s.unavailableText}>Unavailable</Text>
              </View>
            ) : quantity > 0 && onIncrement && onDecrement ? (
              <View style={s.qtyRow}>
                <TouchableOpacity onPress={onDecrement} style={s.qtyBtn} activeOpacity={0.7}>
                  <Minus size={14} color="#FF6B35" />
                </TouchableOpacity>
                <Text style={s.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={onIncrement} style={s.qtyBtn} activeOpacity={0.7}>
                  <Plus size={14} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.8}>
                <Text style={s.addBtnText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  row: { flexDirection: 'row', padding: 14 },
  info: { flex: 1, paddingRight: 12 },
  badges: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  specialBadge: { backgroundColor: 'rgba(255,107,53,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  specialText: { color: '#FF6B35', fontSize: 10, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.2 },
  items: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 8, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  oldPrice: { fontSize: 13, color: '#CBD5E1', fontWeight: '500', textDecorationLine: 'line-through' },
  subBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: '#A7F3D0', borderStyle: 'dashed' },
  subText: { fontSize: 10, color: '#059669', fontWeight: '800' },
  subExtra: { fontSize: 10, color: '#047857', fontWeight: '600', marginTop: 1 },
  imageCol: { alignItems: 'center', width: 120 },
  image: { width: 120, height: 100, borderRadius: 14, backgroundColor: '#F1F5F9' },
  addWrap: { marginTop: -16, width: '100%', paddingHorizontal: 8 },
  unavailableBtn: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  unavailableText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FF6B35',
    borderRadius: 10, overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,107,53,0.06)' },
  qtyText: { color: '#FF6B35', fontWeight: '800', fontSize: 14 },
  addBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingVertical: 8, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
      default: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    }),
  },
  addBtnText: { color: '#10B981', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
