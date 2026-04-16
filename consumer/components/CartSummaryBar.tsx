import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/stores/dataStore';

export function CartSummaryBar() {
  const router = useRouter();
  const items = useCartStore(state => state.items);
  const getTotal = useCartStore(state => state.getTotal);
  if (items.length === 0) return null;

  const totalItems = items.reduce((acc, item) => acc + item.qty, 0);
  const totalAmount = getTotal();

  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <View style={s.iconCircle}>
          <ShoppingBag size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.count}>{totalItems} {totalItems > 1 ? 'items' : 'item'}</Text>
          <Text style={s.amount}>₹{totalAmount} plus taxes</Text>
        </View>
        <TouchableOpacity style={s.btn} activeOpacity={0.8} onPress={() => router.push('/cart')}>
          <Text style={s.btnText}>View Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF6B35', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 8 },
      default: { boxShadow: '0 8px 24px rgba(255,107,53,0.35)' },
    }),
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  count: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  amount: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 12, marginTop: 1 },
  btn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  btnText: { color: '#FF6B35', fontWeight: '800', fontSize: 14 },
});
