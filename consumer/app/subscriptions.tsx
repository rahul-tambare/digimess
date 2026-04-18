import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Pause, Play, SkipForward, XCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/stores/dataStore';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const subs = useSubscriptionStore(s => s.subscriptions);
  const loading = useSubscriptionStore(s => s.loading);
  const fetchSubscriptions = useSubscriptionStore(s => s.fetchSubscriptions);
  const pauseSubscription = useSubscriptionStore(s => s.pauseSubscription);
  const resumeSubscription = useSubscriptionStore(s => s.resumeSubscription);
  const skipDate = useSubscriptionStore(s => s.skipDate);
  const cancelSubscription = useSubscriptionStore(s => s.cancelSubscription);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handlePause = (subId: string) => {
    Alert.alert(
      'Pause Subscription',
      'Your subscription will be paused. Remaining days will be added back when you resume.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause', style: 'destructive',
          onPress: async () => {
            setActionLoading(subId);
            try {
              await pauseSubscription(subId);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to pause subscription');
            } finally {
              setActionLoading(null);
            }
          }
        },
      ]
    );
  };

  const handleResume = async (subId: string) => {
    setActionLoading(subId);
    try {
      await resumeSubscription(subId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resume subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipTomorrow = (subId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    Alert.alert(
      'Skip Tomorrow',
      `Your meal for ${tomorrow.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })} will be skipped. No meal will be deducted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            setActionLoading(subId);
            try {
              await skipDate(subId, dateStr);
              Alert.alert('Done', `Meal skipped for ${tomorrow.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to skip date');
            } finally {
              setActionLoading(null);
            }
          }
        },
      ]
    );
  };

  const handleCancel = (subId: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Your remaining meals will be refunded to your wallet on a pro-rated basis. This cannot be undone.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Plan', style: 'destructive',
          onPress: async () => {
            setActionLoading(subId);
            try {
              const refund = await cancelSubscription(subId);
              Alert.alert(
                'Subscription Cancelled',
                refund > 0 ? `₹${refund} has been refunded to your wallet.` : 'Your subscription has been cancelled.'
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel subscription');
            } finally {
              setActionLoading(null);
            }
          }
        },
      ]
    );
  };

  if (loading && subs.length === 0) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={s.pageSubtitle}>Manage your active and past meal plans.</Text>

        {subs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🍽️</Text>
            <Text style={s.emptyTitle}>No Subscriptions Yet</Text>
            <Text style={s.emptyDesc}>Subscribe to a mess for daily home-cooked meals at flat rates.</Text>
            <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/subscription-plans' as any)}>
              <Text style={s.browseBtnText}>Browse Plans →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {subs.map((sub: any) => {
              const isActive = Boolean(sub.isActive) && new Date(sub.endDate) >= new Date();
              const isPaused = isActive && sub.pauseStartDate != null;
              const isLoading = actionLoading === sub.id;
              console.log('Subscription rendering:', { id: sub.id, type: sub.type, planName: sub.planName, messName: sub.messName, allowedMesses: sub.allowedMesses });

              return (
                <View key={sub.id} style={[s.card, isActive && s.cardActive]}>
                  <View style={s.cardHeader}>
                    <View style={s.iconWrap}><Text style={{ fontSize: 24 }}>🥘</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planName}>
                        {sub.planName || (sub.type === 'multi_mess' ? 'Digi Mess Pro Pass' : sub.messName || 'Meal Plan')}
                      </Text>
                      {sub.type === 'multi_mess' && sub.allowedMesses ? (
                        <Text style={s.messInfo}>
                          📍 Valid at {(() => {
                            try {
                              const messes = typeof sub.allowedMesses === 'string' ? JSON.parse(sub.allowedMesses) : sub.allowedMesses;
                              return Array.isArray(messes) && messes.length > 0 ? messes.length : 'multiple';
                            } catch (e) {
                              return 'multiple';
                            }
                          })()} messes
                        </Text>
                      ) : sub.messName ? (
                        <Text style={s.messInfo}>
                          📍 @ {sub.messName}
                        </Text>
                      ) : (
                        <Text style={s.messInfo}>
                          📍 Valid at All Messes
                        </Text>
                      )}
                      <Text style={s.dates}>
                        {new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to{' '}
                        {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <View style={s.statsRow}>
                    <View style={s.statBox}>
                      <Text style={s.statLabel}>MEALS REMAINING</Text>
                      <Text style={s.statValue}>{sub.mealsRemaining}</Text>
                    </View>
                    <View style={s.statBox}>
                      <Text style={s.statLabel}>STATUS</Text>
                      <Text style={[s.statValue, isPaused ? { color: '#F59E0B' } : isActive ? { color: '#10B981' } : { color: '#94A3B8' }]}>
                        {isPaused ? 'PAUSED' : isActive ? 'ACTIVE' : 'EXPIRED'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions for active subs */}
                  {isActive && (
                    <View style={s.actionsRow}>
                      {isLoading ? (
                        <View style={[s.actionBtn, { justifyContent: 'center' }]}>
                          <ActivityIndicator size="small" color="#FF6B35" />
                        </View>
                      ) : isPaused ? (
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} onPress={() => handleResume(sub.id)}>
                          <Play size={14} color="#10B981" />
                          <Text style={[s.actionBtnText, { color: '#10B981' }]}>Resume</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity style={s.actionBtn} onPress={() => handlePause(sub.id)}>
                            <Pause size={14} color="#FF6B35" />
                            <Text style={s.actionBtnText}>Pause</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]} onPress={() => handleSkipTomorrow(sub.id)}>
                            <SkipForward size={14} color="#D97706" />
                            <Text style={[s.actionBtnText, { color: '#D97706' }]}>Skip Tomorrow</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {/* Cancel button for active subs */}
                  {isActive && !isLoading && (
                    <TouchableOpacity style={s.cancelRow} onPress={() => handleCancel(sub.id)}>
                      <XCircle size={14} color="#94A3B8" />
                      <Text style={s.cancelText}>Cancel Subscription</Text>
                    </TouchableOpacity>
                  )}

                  {/* Renew for expired */}
                  {!isActive && (
                    <TouchableOpacity style={s.renewBtn} onPress={() => router.push('/subscription-plans' as any)}>
                      <Text style={s.renewBtnText}>Renew Plan →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/subscription-plans' as any)}>
              <Text style={s.browseBtnText}>Browse More Plans →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  pageSubtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500', marginBottom: 20 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  cardActive: { borderColor: 'rgba(255,107,53,0.15)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconWrap: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  messInfo: { fontSize: 13, color: '#FF6B35', fontWeight: '700', marginTop: 2 },
  dates: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14 },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.04)',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#FF6B35' },
  cancelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 12, paddingVertical: 8,
  },
  cancelText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  renewBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  renewBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  browseBtn: {
    backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
      default: { boxShadow: '0 6px 16px rgba(255,107,53,0.3)' },
    }),
  },
  browseBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
