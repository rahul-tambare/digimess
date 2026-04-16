// ==========================================
// Earnings & Analytics — Live API Data
// ==========================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { providerApi } from '../services/api';
import StatCard from '../components/ui/StatCard';
import { formatCurrency } from '../lib/utils';

type TimeRange = 'today' | 'week' | 'month';

export default function EarningsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [data, setData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchEarnings = async () => {
        try {
          const [earnings, txns] = await Promise.all([
            providerApi.getEarnings(),
            providerApi.getTransactions(1, 10),
          ]);
          setData(earnings);
          setTransactions(txns.transactions || []);
        } catch (e) {
          console.error('Earnings fetch error:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchEarnings();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const dailyBreakdown = data?.dailyBreakdown || [];
  const maxEarning = Math.max(...dailyBreakdown.map((d: any) => d.amount), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Earnings</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <StatCard label="Total Lifetime" value={formatCurrency(data?.lifetime?.earnings || 0)} icon="💎" variant="primary" />
          <StatCard label="This Month" value={formatCurrency(data?.thisMonth?.earnings || 0)} icon="📅" />
        </View>
        <View style={styles.summaryRow}>
          <StatCard label="This Week" value={formatCurrency(data?.thisWeek?.earnings || 0)} icon="📊" />
          <StatCard label="Today" value={formatCurrency(data?.today?.earnings || 0)} icon="💰" />
        </View>
      </View>

      <View style={styles.ordersCard}>
        <Text style={styles.ordersLabel}>Total Orders Fulfilled</Text>
        <Text style={styles.ordersValue}>{(data?.lifetime?.orders || 0).toLocaleString()}</Text>
      </View>

      {/* Time Range Toggle */}
      <View style={styles.timeRangeRow}>
        {(['today', 'week', 'month'] as const).map(range => (
          <Pressable key={range} style={[styles.timeBtn, timeRange === range && styles.timeBtnActive]} onPress={() => setTimeRange(range)}>
            <Text style={[styles.timeBtnText, timeRange === range && styles.timeBtnTextActive]}>
              {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bar Chart */}
      {dailyBreakdown.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Earnings (Last 7 Days)</Text>
          <View style={styles.chartContainer}>
            {dailyBreakdown.map((d: any, idx: number) => (
              <View key={idx} style={styles.barColumn}>
                <Text style={styles.barValue}>₹{d.amount > 0 ? (d.amount / 1000).toFixed(1) + 'k' : '0'}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, {
                    height: `${(d.amount / maxEarning) * 100}%`,
                    backgroundColor: d.amount > 0 ? Colors.primary : Colors.border,
                  }]} />
                </View>
                <Text style={styles.barLabel}>{(d.day || '').slice(0, 3)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Transaction List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length > 0 ? transactions.map((txn: any) => (
          <View key={txn.id} style={styles.txnCard}>
            <View style={styles.txnLeft}>
              <Text style={styles.txnOrder}>Order #{(txn.id || '').slice(0, 8)}</Text>
              <Text style={styles.txnCustomer}>{txn.customerName || 'Customer'}</Text>
              <Text style={styles.txnDate}>{new Date(txn.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.txnRight}>
              <Text style={styles.txnAmount}>{formatCurrency(txn.totalAmount)}</Text>
              <View style={[styles.payBadge, {
                backgroundColor: txn.status === 'delivered' ? Colors.successBg : txn.status === 'cancelled' ? Colors.errorBg : Colors.warningBg,
              }]}>
                <Text style={[styles.payBadgeText, {
                  color: txn.status === 'delivered' ? Colors.success : txn.status === 'cancelled' ? Colors.error : Colors.warning,
                }]}>{txn.status}</Text>
              </View>
            </View>
          </View>
        )) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { marginBottom: Spacing.xxl },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.semibold },
  title: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  summaryGrid: { gap: Spacing.md, marginBottom: Spacing.lg },
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  ordersCard: {
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.xxl, ...Shadows.md,
  },
  ordersLabel: { fontSize: FontSizes.sm, color: Colors.darkTextSecondary, fontWeight: FontWeights.medium, marginBottom: 4 },
  ordersValue: { fontSize: FontSizes.display, fontWeight: FontWeights.extrabold, color: Colors.textInverse },
  timeRangeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  timeBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  timeBtnActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  timeBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  timeBtnTextActive: { color: Colors.primary, fontWeight: FontWeights.bold },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    marginBottom: Spacing.xxl, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  chartTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.xl },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 160, alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  barValue: { fontSize: 10, color: Colors.textTertiary, fontWeight: FontWeights.medium },
  barTrack: { width: 28, height: 100, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: BorderRadius.sm },
  barLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  txnCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.sm, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  txnLeft: {},
  txnOrder: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  txnCustomer: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  txnDate: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
  txnRight: { alignItems: 'flex-end', gap: Spacing.xs },
  txnAmount: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  payBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  payBadgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  emptyBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  emptyText: { color: Colors.textTertiary, fontSize: FontSizes.md },
});
