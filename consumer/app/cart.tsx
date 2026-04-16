import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Tag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/stores/dataStore';

export default function CartScreen() {
  const router = useRouter();
  const { messName, items, incrementQuantity, decrementQuantity, getTotal } = useCartStore();
  const [deliveryType, setDeliveryType] = useState('Home Delivery');

  if (items.length === 0) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]} edges={['top']}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
        <Text style={s.emptyTitle}>Cart is empty</Text>
        <Text style={s.emptySubtitle}>Add some delicious thalis from a mess!</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
          <Text style={s.primaryBtnText}>Browse Messes</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const subtotal = getTotal();
  const deliveryFee = deliveryType === 'Home Delivery' ? 20 : 0;
  const platformFee = 2;
  const grandTotal = subtotal + deliveryFee + platformFee;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>{messName}</Text>
          <Text style={s.headerSub}>Verify your order details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Fulfillment Mode toggle */}
        <View style={s.toggleRow}>
          {['Home Delivery', 'Takeaway', 'Dine-In'].map((type) => (
            <TouchableOpacity key={type} onPress={() => setDeliveryType(type)}
              style={[s.toggleBtn, deliveryType === type && s.toggleBtnActive]}>
              <Text style={[s.toggleText, deliveryType === type && s.toggleTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cart Items */}
        <View style={s.card}>
          {items.map((item, idx) => (
            <View key={item.thaliId} style={[s.itemRow, idx !== items.length - 1 && s.itemBorder]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', marginRight: 8 }} />
                  <Text style={s.itemName}>{item.name}</Text>
                </View>
                <Text style={s.itemPrice}>₹{item.price}</Text>
              </View>
              <View style={s.qtyControl}>
                <TouchableOpacity onPress={() => decrementQuantity(item.thaliId)} style={s.qtyBtn}>
                  <Text style={s.qtySymbol}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{item.qty}</Text>
                <TouchableOpacity onPress={() => incrementQuantity(item.thaliId)} style={s.qtyBtn}>
                  <Text style={s.qtySymbol}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={() => router.back()} style={s.addMoreBtn}>
            <Text style={s.addMoreText}>+ Add more items</Text>
          </TouchableOpacity>
        </View>

        {/* Slot Picker */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Clock size={18} color="#FF6B35" />
            <Text style={[s.sectionLabel, { marginLeft: 8 }]}>
              {deliveryType === 'Home Delivery' ? 'Select Delivery Slot' : deliveryType === 'Takeaway' ? 'Select Pickup Slot' : 'Select Dine-In Slot'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['1:00 PM - 2:00 PM', '8:00 PM - 9:00 PM'].map((slot, i) => (
              <TouchableOpacity key={i} style={[s.slotChip, i === 0 && s.slotChipActive]}>
                <Text style={[s.slotText, i === 0 && { color: '#FF6B35' }]}>{slot}</Text>
                <Text style={s.slotAvail}>Available</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Coupon */}
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <Tag size={18} color="#94A3B8" />
          <TextInput placeholder="Apply Coupon Code" placeholderTextColor="#CBD5E1" style={s.couponInput} />
          <TouchableOpacity><Text style={s.applyText}>Apply</Text></TouchableOpacity>
        </View>

        {/* Bill Details */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Bill Details</Text>
          <View style={s.billRow}><Text style={s.billLabel}>Item Total</Text><Text style={s.billValue}>₹{subtotal}</Text></View>
          <View style={s.billRow}><Text style={s.billLabel}>Delivery Fee</Text><Text style={s.billValue}>₹{deliveryFee}</Text></View>
          <View style={s.billRow}><Text style={s.billLabel}>Platform Fee</Text><Text style={s.billValue}>₹{platformFee}</Text></View>
          <View style={s.billDivider} />
          <View style={s.billRow}><Text style={s.totalLabel}>To Pay</Text><Text style={s.totalValue}>₹{grandTotal}</Text></View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={s.ctaWrap}>
        <View style={s.ctaBar}>
          <View>
            <Text style={s.ctaAmount}>₹{grandTotal}</Text>
            <Text style={s.ctaSub}>TOTAL</Text>
          </View>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/checkout')}>
            <Text style={s.ctaBtnText}>Proceed →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginBottom: 24 },
  primaryBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  toggleRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14, padding: 4,
    marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9',
  },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: 'rgba(255,107,53,0.08)' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  toggleTextActive: { color: '#FF6B35' },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#FF6B35', borderRadius: 10, overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,107,53,0.06)' },
  qtySymbol: { color: '#FF6B35', fontWeight: '800', fontSize: 18 },
  qtyNum: { color: '#FF6B35', fontWeight: '800', paddingHorizontal: 8, fontSize: 14 },
  addMoreBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center',
  },
  addMoreText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  slotChip: {
    padding: 14, marginRight: 12, borderRadius: 14,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  slotChipActive: { backgroundColor: 'rgba(255,107,53,0.06)', borderColor: '#FFB699' },
  slotText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  slotAvail: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 4 },
  couponInput: { flex: 1, fontSize: 15, fontWeight: '500', color: '#0F172A', marginLeft: 12, paddingVertical: 4 },
  applyText: { color: '#FF6B35', fontWeight: '800', fontSize: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  billValue: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  billDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  ctaWrap: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  ctaBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FF6B35', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 8 },
      default: { boxShadow: '0 8px 24px rgba(255,107,53,0.35)' },
    }),
  },
  ctaAmount: { color: '#FFF', fontWeight: '800', fontSize: 20 },
  ctaSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  ctaBtn: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#FF6B35', fontWeight: '800', fontSize: 15 },
});
