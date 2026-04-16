// ==========================================
// Order Detail Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { providerApi, orderApi } from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency, formatDateTime, getOrderShortId, getInitials } from '../lib/utils';
import type { OrderStatus } from '../types';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await providerApi.getOrderDetail(id || '');
        // Parse items if string
        if (typeof res.items === 'string') res.items = JSON.parse(res.items);
        setOrder(res);
      } catch (e) {
        console.error('Order detail error:', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleAction = async (status: OrderStatus) => {
    const statusMap: Record<string, string> = {
      'accepted': 'confirmed',
      'rejected': 'cancelled',
      'preparing': 'preparing',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
    };
    try {
      await orderApi.updateOrderStatus(order.id, statusMap[status] || status);
      setOrder({ ...order, status: statusMap[status] || status });
    } catch (e) {
      console.error('Status update error:', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.errorContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Order {getOrderShortId(order.id)}</Text>
        <StatusBadge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(order.customerName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.customerName || 'Customer'}</Text>
              <Text style={styles.customerMeta}>Order • {new Date(order.createdAt).toLocaleTimeString()}</Text>
            </View>
            <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.customerPhone || ''}`)}>
              <Text style={styles.callBtnText}>📞 Call</Text>
            </Pressable>
          </View>
          {order.address && (
            <View style={styles.addressBox}>
              <Text style={styles.addressLabel}>📍 Delivery Address</Text>
              <Text style={styles.addressText}>{order.address}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered</Text>
          {(order.items || []).map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity || 1}×</Text>
              <Text style={styles.itemName}>{item.name || item.itemName}</Text>
              <Text style={styles.itemPrice}>{formatCurrency((item.price || 0) * (item.quantity || 1))}</Text>
            </View>
          ))}

        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
          {order.deliveryCharge ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charge</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.deliveryCharge)}</Text>
            </View>
          ) : null}
          {order.discount ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={[styles.priceValue, { color: Colors.success }]}>−{formatCurrency(order.discount)}</Text>
            </View>
          ) : null}
          {order.gst ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.gst)}</Text>
            </View>
          ) : null}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <StatusBadge status={order.status === 'confirmed' ? 'accepted' : order.status} />
            <Text style={styles.timelineTime}>Updated: {formatDateTime(order.updatedAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order.status === 'pending' && (
          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction('rejected')}>
              <Text style={styles.rejectBtnText}>✕ Reject</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAction('accepted')}>
              <Text style={styles.acceptBtnText}>✓ Accept</Text>
            </Pressable>
          </View>
        )}
        {(order.status === 'confirmed') && (
          <Pressable style={[styles.fullBtn, { backgroundColor: Colors.statusPreparing }]} onPress={() => handleAction('preparing')}>
            <Text style={styles.fullBtnText}>👨‍🍳 Start Preparing</Text>
          </Pressable>
        )}
        {order.status === 'preparing' && (
          <Pressable style={[styles.fullBtn, { backgroundColor: Colors.statusOutForDelivery }]} onPress={() => handleAction('out_for_delivery')}>
            <Text style={styles.fullBtnText}>📦 Mark as Ready</Text>
          </Pressable>
        )}
        {order.status === 'out_for_delivery' && (
          <Pressable style={[styles.fullBtn, { backgroundColor: Colors.statusDelivered }]} onPress={() => handleAction('delivered')}>
            <Text style={styles.fullBtnText}>✅ Mark as Delivered</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { fontSize: FontSizes.lg, color: Colors.textSecondary, marginBottom: Spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { paddingVertical: Spacing.xs },
  backBtnText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.semibold },
  backBtnAlt: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  backBtnAltText: { color: Colors.textInverse, fontWeight: FontWeights.bold },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  scrollContent: { padding: Spacing.xl },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    marginBottom: Spacing.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.primary },
  customerName: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  customerMeta: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  callBtn: { backgroundColor: Colors.successBg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  callBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.success },
  addressBox: { marginTop: Spacing.lg, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md },
  addressLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textSecondary, marginBottom: 4 },
  addressText: { fontSize: FontSizes.md, color: Colors.textPrimary, lineHeight: 22 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemQty: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.primary, width: 36 },
  itemName: { flex: 1, fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: FontWeights.medium },
  itemPrice: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  noteBox: { marginTop: Spacing.md, backgroundColor: Colors.warningBg, borderRadius: BorderRadius.md, padding: Spacing.md },
  noteLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.warningDark, marginBottom: 4 },
  noteText: { fontSize: FontSizes.md, color: Colors.warningDark, fontStyle: 'italic' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  priceLabel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  priceValue: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.md },
  totalLabel: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  totalValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, color: Colors.primary },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineDot: { alignItems: 'center', width: 24, marginRight: Spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border, marginTop: 4 },
  dotActive: { backgroundColor: Colors.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: Spacing.xl, gap: Spacing.xs },
  timelineTime: { fontSize: FontSizes.sm, color: Colors.textTertiary },
  timelineNote: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1, paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center' },
  rejectBtn: { backgroundColor: Colors.errorBg },
  rejectBtnText: { color: Colors.error, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  acceptBtn: { backgroundColor: Colors.success },
  acceptBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  fullBtn: { paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center' },
  fullBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
});
