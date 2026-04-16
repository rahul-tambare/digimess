import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function OrderSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* App Header */}
      <View style={s.header}>
        <Text style={{ fontSize: 22 }}>🍽️</Text>
        <Text style={s.headerTitle}>Digi Mess</Text>
      </View>

      <View style={s.content}>
        {/* Icon */}
        <View style={s.iconWrap}>
          <Text style={{ fontSize: 56 }}>✅</Text>
        </View>
        <Text style={s.title}>Success!</Text>
        <Text style={s.subtitle}>Your culinary journey begins now.</Text>

        {/* Order Card */}
        <View style={s.orderCard}>
          <View style={s.orderCardHeader}>
            <View>
              <Text style={s.metaLabel}>ORDER ID</Text>
              <Text style={s.metaValue}>#ORD-8912</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.metaLabel, { color: '#10B981' }]}>ESTIMATED DELIVERY</Text>
              <Text style={s.metaValue}>Today, 12:30 PM</Text>
            </View>
          </View>

          <Text style={s.summaryLabel}>ORDER SUMMARY</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryImgPlaceholder}>
              <Text style={{ fontSize: 28 }}>🍛</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryTitle}>Food Order Confirmed</Text>
              <Text style={s.summarySubtitle}>Your Selected Meals</Text>
              <View style={s.tagsRow}>
                <View style={s.tagGreen}><Text style={s.tagGreenText}>HEALTHY</Text></View>
                <View style={s.tagOrange}><Text style={s.tagOrangeText}>FRESH</Text></View>
              </View>
            </View>
            <Text style={s.paidText}>Paid ✓</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={s.trackBtn} onPress={() => router.push('/order/order001')}>
          <Text style={s.trackBtnText}>🗺️ Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.rateBtn} onPress={() => router.push('/rating')}>
          <Text style={s.rateBtnText}>⭐ Rate Your Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FF6B35' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 110, height: 110, borderRadius: 36, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      default: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
    }),
  },
  title: { fontSize: 36, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500', marginBottom: 32 },
  orderCard: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 28,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  orderCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16, marginBottom: 16,
  },
  metaLabel: { fontSize: 9, fontWeight: '800', color: '#FF6B35', letterSpacing: 1, marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  summaryLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  summaryImgPlaceholder: {
    width: 60, height: 60, borderRadius: 14, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  summarySubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginBottom: 8 },
  paidText: { fontSize: 14, fontWeight: '800', color: '#10B981' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tagGreen: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  tagGreenText: { fontSize: 9, fontWeight: '800', color: '#065F46', letterSpacing: 0.5 },
  tagOrange: { backgroundColor: 'rgba(255,107,53,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  tagOrangeText: { fontSize: 9, fontWeight: '800', color: '#C2410C', letterSpacing: 0.5 },
  trackBtn: {
    width: '100%', backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
      default: { boxShadow: '0 6px 16px rgba(255,107,53,0.3)' },
    }),
  },
  trackBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  rateBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#F1F5F9',
  },
  rateBtnText: { color: '#FF6B35', fontSize: 16, fontWeight: '800' },
  homeBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#F1F5F9' },
  homeBtnText: { color: '#475569', fontSize: 16, fontWeight: '800' },
});
