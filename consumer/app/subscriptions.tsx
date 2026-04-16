import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Pause, Play, SkipForward } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// In production: import api from '@/services/api';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    // Simulate: const res = await api.get('/user/subscriptions');
    setTimeout(() => {
      setSubs([
        {
          id: 'sub001', messId: 'mess001', messName: "Sunita's Home Kitchen",
          type: 'single_mess', startDate: '2026-04-01', endDate: '2026-05-01',
          mealsRemaining: 18, isActive: true, pauseStartDate: null, pauseEndDate: null,
        },
        {
          id: 'sub002', messId: null, messName: null,
          type: 'multi_mess', startDate: '2026-03-01', endDate: '2026-03-31',
          mealsRemaining: 0, isActive: false, pauseStartDate: null, pauseEndDate: null,
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  const handlePause = (subId: string) => {
    Alert.alert(
      'Pause Subscription',
      'Your subscription will be paused. Remaining days will be added back when you resume.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause', style: 'destructive',
          onPress: () => {
            // In production: await api.post(`/user/subscriptions/${subId}/pause`, { pauseStartDate: today, pauseEndDate: null })
            setSubs(prev => prev.map(s => s.id === subId ? { ...s, pauseStartDate: new Date().toISOString() } : s));
          }
        },
      ]
    );
  };

  const handleResume = (subId: string) => {
    // In production: await api.post(`/user/subscriptions/${subId}/resume`)
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, pauseStartDate: null, pauseEndDate: null } : s));
  };

  const handleSkipTomorrow = (subId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    Alert.alert('Skip Tomorrow', `Your meal for ${tomorrow.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })} will be skipped. No meal will be deducted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', onPress: () => { /* In production: api.post(`/subscriptions/${subId}/skip`, { date: tomorrow }) */ } },
    ]);
  };

  if (loading) {
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
            {subs.map((sub) => {
              const isActive = sub.isActive && new Date(sub.endDate) >= new Date();
              const isPaused = isActive && sub.pauseStartDate != null;

              return (
                <View key={sub.id} style={[s.card, isActive && s.cardActive]}>
                  <View style={s.cardHeader}>
                    <View style={s.iconWrap}><Text style={{ fontSize: 24 }}>🥘</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planName}>
                        {sub.type === 'multi_mess' ? 'Digi Mess Pro Pass' : sub.messName || 'Single Mess Plan'}
                      </Text>
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
                      {isPaused ? (
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
