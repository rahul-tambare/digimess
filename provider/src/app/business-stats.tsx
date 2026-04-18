// ==========================================
// Business Stats Screen — Provider
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { providerApi } from '../services/api';
import { formatCurrency } from '../lib/utils';

// ── Helpers
function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <Text style={{ fontSize: 14, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (i <= full ? '★' : '☆')).join('')}
    </Text>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// ── Rating bar row
function RatingRow({ star, count, pct, maxPct }: { star: number; count: number; pct: number; maxPct: number }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingStarLabel}>{star}★</Text>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${maxPct > 0 ? (pct / maxPct) * 100 : 0}%` }]} />
      </View>
      <Text style={styles.ratingCount}>{count}</Text>
    </View>
  );
}

// ── Stat tile
interface TileProps { label: string; value: string; icon: string; accent?: string; }
function Tile({ label, value, icon, accent }: TileProps) {
  return (
    <View style={[styles.tile, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default function BusinessStatsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      providerApi.getStats()
        .then(setData)
        .catch((e: any) => setError(e.message || 'Failed to load stats'))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Crunching your numbers…</Text>
      </View>
    );
  }

  if (error || !data?.hasMess) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>📊</Text>
        <Text style={styles.errorTitle}>{data?.hasMess === false ? 'No Mess Found' : 'Something Went Wrong'}</Text>
        <Text style={styles.errorSub}>{data?.hasMess === false ? 'Register a mess to see your stats.' : error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); providerApi.getStats().then(setData).catch((e: any) => setError(e.message)).finally(() => setLoading(false)); }}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { orders, earnings, reviews, topCustomers, dailyBreakdown } = data;
  const maxBarAmount = Math.max(...(dailyBreakdown?.map((d: any) => d.amount) || [1]), 1);
  const maxRatingPct = Math.max(...(reviews.breakdown?.map((b: any) => b.pct) || [1]), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scroll, isTablet && { maxWidth: 700, alignSelf: 'center' as any }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.pageTitle}>Business Stats</Text>
        <Text style={styles.messName}>{data.mess?.name}</Text>
      </View>

      {/* ── Orders Overview ── */}
      <SectionTitle>Orders Overview</SectionTitle>
      <View style={styles.tileGrid}>
        <Tile icon="📦" label="Total Orders" value={orders.total.toLocaleString()} accent={Colors.primary} />
        <Tile icon="✅" label="Completed" value={orders.completed.toLocaleString()} accent={Colors.success} />
        <Tile icon="❌" label="Cancelled" value={orders.cancelled.toLocaleString()} accent={Colors.error} />
        <Tile icon="⏳" label="In Progress" value={orders.pending.toLocaleString()} accent={Colors.warning} />
      </View>

      {/* Completion Rate Banner */}
      <View style={styles.completionBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.completionLabel}>Order Completion Rate</Text>
          <View style={styles.completionBarTrack}>
            <View style={[styles.completionBarFill, { width: `${Math.min(orders.completionRate, 100)}%` as any }]} />
          </View>
        </View>
        <Text style={styles.completionPct}>{orders.completionRate}%</Text>
      </View>

      {/* ── Earnings Summary ── */}
      <SectionTitle>Earnings Summary</SectionTitle>
      <View style={styles.earningsCard}>
        <View style={styles.earningsHero}>
          <Text style={styles.heroLabel}>Lifetime Revenue</Text>
          <Text style={styles.heroValue}>{formatCurrency(earnings.lifetime)}</Text>
        </View>
        <View style={styles.earningsRow}>
          <View style={styles.earningsPill}>
            <Text style={styles.earningsPillLabel}>This Week</Text>
            <Text style={styles.earningsPillValue}>{formatCurrency(earnings.thisWeek)}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsPill}>
            <Text style={styles.earningsPillLabel}>This Month</Text>
            <Text style={styles.earningsPillValue}>{formatCurrency(earnings.thisMonth)}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsPill}>
            <Text style={styles.earningsPillLabel}>Avg. Order</Text>
            <Text style={styles.earningsPillValue}>{formatCurrency(earnings.avgOrderValue)}</Text>
          </View>
        </View>
      </View>

      {/* ── Daily Earnings Chart ── */}
      {dailyBreakdown && dailyBreakdown.length > 0 && (
        <>
          <SectionTitle>Daily Earnings (Last 14 Days)</SectionTitle>
          <View style={styles.chartCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              {dailyBreakdown.map((d: any, idx: number) => (
                <View key={idx} style={styles.barCol}>
                  <Text style={styles.barAmt}>
                    {d.amount > 0 ? `₹${(d.amount / 1000).toFixed(1)}k` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      {
                        height: `${(d.amount / maxBarAmount) * 100}%`,
                        backgroundColor: d.amount > 0 ? Colors.primary : Colors.borderLight,
                      },
                    ]} />
                  </View>
                  <Text style={styles.barDay}>{(d.day || '').slice(0, 3)}</Text>
                  <Text style={styles.barOrders}>{d.orders}✓</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* ── Reviews & Rating ── */}
      <SectionTitle>Customer Reviews</SectionTitle>
      <View style={styles.reviewsCard}>
        {/* Big rating */}
        <View style={styles.ratingHero}>
          <Text style={styles.ratingBig}>{(reviews.avgRating || 0).toFixed(1)}</Text>
          <Stars rating={reviews.avgRating || 0} />
          <Text style={styles.ratingTotal}>{reviews.total} review{reviews.total !== 1 ? 's' : ''}</Text>
        </View>

        {/* Breakdown bars */}
        <View style={styles.ratingBarsWrap}>
          {reviews.breakdown?.map((b: any) => (
            <RatingRow key={b.star} star={b.star} count={b.count} pct={b.pct} maxPct={maxRatingPct} />
          ))}
        </View>
      </View>

      {/* Recent Reviews */}
      {reviews.recent && reviews.recent.length > 0 && (
        <View style={styles.recentReviewsCard}>
          <Text style={styles.subsectionTitle}>Recent Feedback</Text>
          {reviews.recent.map((r: any, idx: number) => (
            <View key={idx} style={[styles.reviewItem, idx < reviews.recent.length - 1 && styles.reviewItemBorder]}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewCustomer}>{r.customerName || 'Customer'}</Text>
                <Text style={styles.reviewRating}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
              </View>
              {r.reviewText ? <Text style={styles.reviewText}>{r.reviewText}</Text> : null}
              <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Top Customers ── */}
      {topCustomers && topCustomers.length > 0 && (
        <>
          <SectionTitle>Top Customers</SectionTitle>
          <View style={styles.card}>
            {topCustomers.map((c: any, idx: number) => (
              <View key={idx} style={[styles.customerRow, idx < topCustomers.length - 1 && styles.customerBorder]}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>{(c.name || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerOrders}>{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.customerSpent}>{formatCurrency(c.totalSpent)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  loadingText: { color: Colors.textTertiary, marginTop: Spacing.lg, fontSize: FontSizes.sm },
  errorEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  errorTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  errorSub: { color: Colors.textTertiary, fontSize: FontSizes.sm, textAlign: 'center', marginBottom: Spacing.xl },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  retryText: { color: '#fff', fontWeight: FontWeights.bold, fontSize: FontSizes.md },

  header: { marginBottom: Spacing.xxl },
  backBtn: { marginBottom: Spacing.md },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.semibold },
  pageTitle: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  messName: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 4 },

  sectionTitle: {
    fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md, marginTop: Spacing.lg,
  },
  subsectionTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  tile: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  tileIcon: { fontSize: 22, marginBottom: Spacing.sm },
  tileValue: { fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold, color: Colors.textPrimary },
  tileLabel: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 3, fontWeight: FontWeights.medium },

  completionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  completionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.semibold, marginBottom: Spacing.sm },
  completionBarTrack: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  completionBarFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 4 },
  completionPct: { fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, color: Colors.success, minWidth: 56, textAlign: 'right' },

  earningsCard: {
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadows.md, marginBottom: Spacing.lg,
  },
  earningsHero: { padding: Spacing.xl, paddingBottom: Spacing.lg },
  heroLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FontWeights.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue: { fontSize: 36, fontWeight: FontWeights.extrabold, color: '#fff', marginTop: Spacing.xs },
  earningsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  earningsPill: { flex: 1, padding: Spacing.lg, alignItems: 'center' },
  earningsPillLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: FontWeights.medium },
  earningsPillValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.extrabold, color: '#fff', marginTop: 4 },
  earningsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  chartCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  chartScroll: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingBottom: 4 },
  barCol: { width: 44, alignItems: 'center', gap: 4 },
  barAmt: { fontSize: 9, color: Colors.textTertiary, textAlign: 'center' },
  barTrack: { width: 28, height: 100, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: BorderRadius.sm },
  barDay: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  barOrders: { fontSize: 9, color: Colors.textTertiary },

  reviewsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
    flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.md,
  },
  ratingHero: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  ratingBig: { fontSize: 44, fontWeight: FontWeights.extrabold, color: Colors.textPrimary, lineHeight: 48 },
  ratingTotal: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 4, textAlign: 'center' },
  ratingBarsWrap: { flex: 1, gap: 6, justifyContent: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingStarLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, width: 22, textAlign: 'right', fontWeight: FontWeights.medium },
  ratingBarTrack: { flex: 1, height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: Colors.warning, borderRadius: 3 },
  ratingCount: { fontSize: FontSizes.xs, color: Colors.textTertiary, width: 24, textAlign: 'right' },

  recentReviewsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  reviewItem: { paddingVertical: Spacing.md },
  reviewItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewCustomer: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  reviewRating: { fontSize: 12, color: Colors.warning, letterSpacing: 1 },
  reviewText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  reviewDate: { fontSize: FontSizes.xs, color: Colors.textTertiary },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  customerBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  customerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center',
  },
  customerAvatarText: { color: Colors.primary, fontWeight: FontWeights.extrabold, fontSize: FontSizes.md },
  customerName: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  customerOrders: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
  customerSpent: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
});
