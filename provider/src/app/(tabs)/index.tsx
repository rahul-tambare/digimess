// ==========================================
// Dashboard Screen — Live API Data
// ==========================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { providerApi } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency, getInitials, getOrderShortId } from '../../lib/utils';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await providerApi.getDashboard();
      setData(res);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleToggleMess = async () => {
    try {
      const res = await providerApi.toggleMess();
      // Update local data
      if (data) {
        setData({ ...data, mess: { ...data.mess, isOpen: res.isOpen } });
      }
    } catch (e) {
      console.error('Toggle error:', e);
    }
  };

  if (loading && !data) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textTertiary, marginTop: Spacing.md }}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!data?.hasMess) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl }]}>
        <EmptyState
          emoji="🏪"
          title="No Mess Registered"
          description="Complete your onboarding to set up your mess."
          actionLabel="Start Onboarding"
          onAction={() => router.push('/onboarding')}
        />
      </View>
    );
  }

  const { mess, today, recentOrders } = data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name || 'P')}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hello, {(user?.name || 'Provider').split(' ')[0]}! 👋</Text>
            <Text style={styles.messName}>{mess.name}</Text>
          </View>
        </View>
        <View style={styles.statusToggle}>
          <Text style={[styles.statusLabel, mess.isOpen ? styles.statusOpen : styles.statusClosed]}>
            {mess.isOpen ? 'OPEN' : 'CLOSED'}
          </Text>
          <Switch
            value={!!mess.isOpen}
            onValueChange={handleToggleMess}
            trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
            thumbColor={mess.isOpen ? Colors.success : Colors.error}
          />
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard label="Today's Earnings" value={formatCurrency(today.earnings)} icon="💰" variant="dark" />
          <StatCard label="Today's Orders" value={`${today.orders}`} icon="📦" variant="dark" />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Pending"
            value={`${today.pending}`}
            icon="⏳"
            trend={today.pending > 0 ? 'up' : 'neutral'}
            trendValue={today.newOrders > 0 ? `${today.newOrders} new` : undefined}
          />
          <StatCard label="Rating" value={`${mess.rating || 0} ★`} icon="⭐" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => router.push('/orders' as any)}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.infoBg }]}>
              <Text style={styles.quickEmoji}>📋</Text>
            </View>
            <Text style={styles.quickLabel}>View Orders</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push('/menu' as any)}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.warningBg }]}>
              <Text style={styles.quickEmoji}>🍽️</Text>
            </View>
            <Text style={styles.quickLabel}>Edit Menu</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push('/earnings')}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.successBg }]}>
              <Text style={styles.quickEmoji}>💰</Text>
            </View>
            <Text style={styles.quickLabel}>Earnings</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <Pressable onPress={() => router.push('/orders' as any)}>
            <Text style={styles.viewAll}>View All →</Text>
          </Pressable>
        </View>

        {recentOrders && recentOrders.length > 0 ? recentOrders.map((order: any) => (
          <Pressable
            key={order.id}
            style={styles.orderPreview}
            onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id } })}
          >
            <View style={styles.orderLeft}>
              <View style={styles.orderAvatar}>
                <Text style={styles.orderAvatarText}>{getInitials(order.customerName || 'C')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderCustomer}>{order.customerName || 'Customer'}</Text>
                <Text style={styles.orderItems} numberOfLines={1}>
                  {Array.isArray(order.items) ? order.items.map((i: any) => `${i.quantity || 1}× ${i.name || i.itemName}`).join(', ') : 'Order items'}
                </Text>
              </View>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
              <StatusBadge status={order.status} size="sm" />
            </View>
          </Pressable>
        )) : (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyText}>📭 No recent orders</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  messName: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
    marginTop: 2,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  statusLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
  },
  statusOpen: {
    color: Colors.success,
  },
  statusClosed: {
    color: Colors.error,
  },
  statsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  viewAll: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickEmoji: {
    fontSize: 22,
  },
  quickLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  orderPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  orderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderAvatarText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  orderCustomer: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  orderItems: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  orderAmount: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  emptyOrders: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textTertiary,
  },
});
