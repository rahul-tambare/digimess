import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useOrderStore } from '@/stores/dataStore';

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  accepted: 'Order Confirmed',
  confirmed: 'Order Confirmed',
  preparing: 'Vendor Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchOrderDetail = useOrderStore(state => state.fetchOrderDetail);
  const currentOrder = useOrderStore(state => state.currentOrder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchOrderDetail(id).finally(() => setLoading(false));
    }
  }, [id]);

  // Polling logic with useFocusEffect so it stops when navigating away, and stops when order is terminal
  const isTerminal = currentOrder && ['delivered', 'cancelled', 'rejected'].includes(currentOrder.status);
  
  useFocusEffect(
    useCallback(() => {
      if (!id || isTerminal) return;
      const interval = setInterval(() => fetchOrderDetail(id as string), 3000);
      return () => clearInterval(interval);
    }, [id, isTerminal])
  );

  const getActiveStepIndex = () => {
    if (!currentOrder) return 0;
    const status = currentOrder.status === 'confirmed' ? 'accepted' : currentOrder.status;
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const activeStep = getActiveStepIndex();
  const isCancelled = currentOrder?.status === 'cancelled' || currentOrder?.status === 'rejected';
  const isDelivered = currentOrder?.status === 'delivered';

  // Parse items
  const items = currentOrder?.items
    ? (typeof currentOrder.items === 'string' ? JSON.parse(currentOrder.items) : currentOrder.items)
    : [];

  const shortId = id ? id.slice(0, 8).toUpperCase() : '';

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: '#94A3B8', marginTop: 12, fontWeight: '600' }}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentOrder) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 16 }}>Order not found</Text>
          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace('/(tabs)/orders')}>
            <Text style={{ color: '#FF6B35', fontWeight: '700' }}>← Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/orders')} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Track Order</Text>
          <Text style={s.orderId}>#{shortId}</Text>
        </View>
        <TouchableOpacity style={s.helpBtn}><HelpCircle size={20} color="#475569" /></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={s.mapArea}>
          {isCancelled ? (
            <View style={[s.deliveredBanner, { backgroundColor: '#FEF2F2' }]}>
              <View style={[s.checkCircle, { backgroundColor: '#EF4444' }]}><Text style={{ fontSize: 28, color: '#FFF' }}>✕</Text></View>
              <Text style={[s.deliveredTitle, { color: '#991B1B' }]}>{currentOrder.status === 'rejected' ? 'Rejected' : 'Cancelled'}</Text>
              <Text style={[s.deliveredSub, { color: '#B91C1C' }]}>This order has been {currentOrder.status}</Text>
            </View>
          ) : isDelivered ? (
            <View style={s.deliveredBanner}>
              <View style={s.checkCircle}><Text style={{ fontSize: 28, color: '#FFF' }}>✓</Text></View>
              <Text style={s.deliveredTitle}>Delivered!</Text>
              <Text style={s.deliveredSub}>Hope you enjoy your Ghar Jaisa Khana</Text>
            </View>
          ) : (
            <View style={[s.deliveredBanner, { backgroundColor: '#FFF7ED' }]}>
              <Text style={{ fontSize: 48 }}>🍳</Text>
              <Text style={[s.deliveredTitle, { color: '#C2410C' }]}>{STATUS_LABELS[currentOrder.status] || currentOrder.status}</Text>
              <Text style={[s.deliveredSub, { color: '#EA580C' }]}>Your order is being processed</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        {!isCancelled && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Order Status</Text>
            <View style={{ paddingLeft: 4 }}>
              {STATUS_STEPS.map((step, idx) => {
                const isActive = idx === activeStep;
                const isPast = idx < activeStep;
                const isLast = idx === STATUS_STEPS.length - 1;
                return (
                  <View key={idx} style={[s.stepRow, !isLast && { marginBottom: 24 }]}>
                    {!isLast && <View style={[s.stepLine, isPast && { backgroundColor: '#FF6B35' }]} />}
                    <View style={[s.stepDot, isPast && s.stepDotPast, isActive && s.stepDotActive]}>
                      {isActive && <View style={s.stepDotInner} />}
                      {isPast && <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={[s.stepTitle, !(isPast || isActive) && { color: '#CBD5E1' }]}>
                        {STATUS_LABELS[step] || step}
                      </Text>
                      {isActive && (
                        <Text style={s.stepDesc}>
                          {step === 'pending' ? 'Waiting for vendor to accept' :
                           step === 'accepted' ? 'Vendor has confirmed your order' :
                           step === 'preparing' ? 'Being prepared — ready soon' :
                           step === 'out_for_delivery' ? 'On the way to you' :
                           'Enjoy your meal!'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Order Details</Text>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Items</Text>
            <Text style={s.detailValue}>
              {items.map((item: any) => `${item.quantity || 1}× ${item.name}`).join(', ') || 'N/A'}
            </Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Total</Text>
            <Text style={s.detailValue}>
              ₹{currentOrder.totalAmount} ({currentOrder.paymentMethod === 'cod' ? 'Cash on Delivery' :
                currentOrder.paymentMethod === 'upi' ? 'Paid via UPI' :
                currentOrder.paymentMethod === 'card' ? 'Paid via Card' :
                currentOrder.paymentMethod === 'wallet' ? 'Paid via Wallet' :
                currentOrder.paymentMethod === 'subscription' ? 'Subscription' :
                'Paid'})
            </Text>
          </View>
          {(currentOrder.deliveryAddress || currentOrder.address) && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Delivery</Text>
              <Text style={s.detailValue}>{currentOrder.deliveryAddress || currentOrder.address}</Text>
            </View>
          )}
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Type</Text>
            <Text style={s.detailValue}>
              {currentOrder.deliveryType === 'delivery' ? '🚚 Delivery' :
               currentOrder.deliveryType === 'pickup' ? '🏃 Pickup' :
               currentOrder.deliveryType || 'N/A'}
            </Text>
          </View>
          {currentOrder.messName && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Mess</Text>
              <Text style={s.detailValue}>{currentOrder.messName}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  orderId: { fontSize: 12, color: '#FF6B35', fontWeight: '700' },
  helpBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  mapArea: { height: 200, backgroundColor: '#F1F5F9', position: 'relative' },
  deliveredBanner: { flex: 1, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deliveredTitle: { fontSize: 24, fontWeight: '800', color: '#065F46' },
  deliveredSub: { fontSize: 14, color: '#047857', fontWeight: '500', marginTop: 4 },
  card: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 20, letterSpacing: -0.3 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  stepLine: { position: 'absolute', left: 7, top: 20, bottom: -28, width: 2, backgroundColor: '#E2E8F0' },
  stepDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#E2E8F0',
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  stepDotPast: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  stepDotActive: { borderColor: '#FF6B35' },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  stepDesc: { fontSize: 13, color: '#FF6B35', fontWeight: '600', marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
});
