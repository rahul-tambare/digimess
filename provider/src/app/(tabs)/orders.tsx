// ==========================================
// Orders Screen — Live API Data
// ==========================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import { orderApi } from '../../services/api';
import OrderCard from '../../components/ui/OrderCard';
import EmptyState from '../../components/ui/EmptyState';
import type { OrderStatus } from '../../types';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: '🔴 New' },
  { key: 'preparing', label: '👨‍🍳 Active' },
  { key: 'delivered', label: '✅ Done' },
  { key: 'cancelled', label: '❌ Cancelled' },
] as const;

type FilterKey = typeof FILTER_TABS[number]['key'];

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getProviderOrders();
      // Parse items field if string
      const parsed = (res || []).map((o: any) => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
      }));
      setOrders(parsed);
    } catch (e) {
      console.error('Orders fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
      
      // Poll every 3s for live updates
      const interval = setInterval(() => {
        fetchOrders();
      }, 3000);
      
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // Map frontend status names to backend enum values
      const statusMap: Record<string, string> = {
        'accepted': 'accepted',
        'rejected': 'rejected',
        'preparing': 'preparing',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
      };
      const backendStatus = statusMap[status] || status;
      await orderApi.updateOrderStatus(orderId, backendStatus);
      // Refresh orders after status change
      fetchOrders();
    } catch (e) {
      console.error('Status update error:', e);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return o.status === 'pending';
    if (activeFilter === 'preparing') return ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status);
    if (activeFilter === 'delivered') return o.status === 'delivered';
    if (activeFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>{filteredOrders.length} orders</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterTab, activeFilter === item.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(item.key as FilterKey)}
            >
              <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Order List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <OrderCard
            order={{
              ...item,
              // Map backend status to frontend display
              status: item.status === 'confirmed' ? 'accepted' : item.status,
              customerName: item.customerName || 'Customer',
              mealTime: item.mealTime || 'Lunch',
              deliveryType: item.deliveryType || 'delivery',
              totalAmount: item.totalAmount,
              items: item.items || [],
            }}
            onAccept={() => handleUpdateStatus(item.id, 'accepted')}
            onReject={() => handleUpdateStatus(item.id, 'rejected')}
            onUpdateStatus={(status: OrderStatus) => handleUpdateStatus(item.id, status)}
            onPress={() => router.push({ pathname: '/order-detail', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="📭"
            title="No orders found"
            description={activeFilter === 'all' ? "You haven't received any orders yet." : `No ${activeFilter} orders right now.`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: FontWeights.medium,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.massive,
  },
});
