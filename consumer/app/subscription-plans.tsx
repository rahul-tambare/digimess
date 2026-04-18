import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubscriptionStore, useWalletStore, useDataStore } from '@/stores/dataStore';

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { messId } = useLocalSearchParams<{ messId?: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMesses, setSelectedMesses] = useState<string[]>([]);

  const plans = useSubscriptionStore(s => s.plans);
  const subscriptions = useSubscriptionStore(s => s.subscriptions);
  const loading = useSubscriptionStore(s => s.loading);
  const fetchPlans = useSubscriptionStore(s => s.fetchPlans);
  const fetchSubscriptions = useSubscriptionStore(s => s.fetchSubscriptions);
  const purchasePlan = useSubscriptionStore(s => s.purchasePlan);

  const walletBalance = useWalletStore(s => s.balance);
  const fetchBalance = useWalletStore(s => s.fetchBalance);

  const messes = useDataStore(s => s.messes);
  const fetchMesses = useDataStore(s => s.fetchMesses);

  useEffect(() => {
    fetchPlans();
    fetchBalance();
    fetchSubscriptions();
    fetchMesses({}, 1);
  }, []);

  // Auto-select most popular plan on load
  useEffect(() => {
    if (plans.length > 0 && !selectedId) {
      // Default to the 30-meal plan, or the third one, or the first
      const popular = plans.find(p => p.mealsCount === 30) || plans[2] || plans[0];
      setSelectedId(popular?.id);
    }
  }, [plans]);

  const selected = plans.find((p: any) => p.id === selectedId);
  const activeSubs = subscriptions.filter((s: any) => s.isActive && new Date(s.endDate) >= new Date());
  const activeSubCount = activeSubs.length;

  const handleConfirm = async () => {
    if (!selected) return;

    const planPrice = parseFloat(selected.price);
    if (walletBalance < planPrice) {
      const shortfall = planPrice - walletBalance;
      if (Platform.OS === 'web') {
        const goTopUp = window.confirm(
          `Insufficient Wallet Balance\n\nYou need ₹${shortfall} more to purchase this plan. Top up your wallet to continue.\n\nPress OK to top up.`
        );
        if (goTopUp) router.push('/wallet-topup' as any);
      } else {
        Alert.alert(
          'Insufficient Wallet Balance',
          `You need ₹${shortfall} more to purchase this plan. Top up your wallet to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Top Up', onPress: () => router.push('/wallet-topup' as any) },
          ]
        );
      }
      return;
    }

    const doPurchase = async () => {
      setSubmitting(true);
      try {
        // Updated to start today instead of tomorrow based on user request
        const today = new Date();
        const startDateStr = today.toISOString().split('T')[0];
        
        await purchasePlan(
          selected.id, 
          messId, 
          startDateStr, 
          selectedMesses.length > 0 ? selectedMesses : undefined
        );
        if (Platform.OS === 'web') {
          window.alert('Success! 🎉\n\nYour subscription is now active.');
          router.replace('/subscriptions' as any);
        } else {
          Alert.alert('Success! 🎉', 'Your subscription is now active.', [
            { text: 'View Subscriptions', onPress: () => router.replace('/subscriptions' as any) },
          ]);
        }
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(`Error: ${err.message || 'Failed to purchase plan'}`);
        } else {
          Alert.alert('Error', err.message || 'Failed to purchase plan');
        }
      } finally {
        setSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Confirm Purchase\n\n₹${selected.price} will be deducted from your wallet for "${selected.name}" (${selected.mealsCount} meals).`
      );
      if (confirmed) await doPurchase();
    } else {
      Alert.alert(
        'Confirm Purchase',
        `₹${selected.price} will be deducted from your wallet for "${selected.name}" (${selected.mealsCount} meals).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: doPurchase },
        ]
      );
    }
  };

  if (loading && plans.length === 0) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    );
  }

  // Parse benefits for display
  const getBenefits = (plan: any): string[] => {
    if (Array.isArray(plan.benefits)) return plan.benefits;
    if (typeof plan.benefits === 'string') {
      try { return JSON.parse(plan.benefits); } catch { return []; }
    }
    return [];
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Choose a Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={s.heroTitle}>Subscribe & Save</Text>
        <Text style={s.heroSub}>Select a meal plan that suits your daily needs.</Text>

        {/* Status cards */}
        <View style={s.statusRow}>
          <View style={[s.statusCard, { backgroundColor: '#F8FAFC' }]}>
            <Text style={s.statusLabel}>CURRENT STATUS</Text>
            <Text style={s.statusValue}>
              {activeSubCount > 0 ? `${activeSubCount} Active Plan${activeSubCount > 1 ? 's' : ''}` : 'No Active Plan'}
            </Text>
          </View>
          <View style={[s.statusCard, { backgroundColor: '#FF6B35' }]}>
            <Text style={{ fontSize: 22, marginBottom: 6 }}>💳</Text>
            <Text style={[s.statusLabel, { color: 'rgba(255,255,255,0.7)' }]}>WALLET</Text>
            <Text style={[s.statusValue, { color: '#FFF' }]}>₹{walletBalance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Plan Cards */}
        {plans.map((plan: any) => {
          const canAfford = walletBalance >= parseFloat(plan.price);
          return (
            <TouchableOpacity key={plan.id} onPress={() => setSelectedId(plan.id)}
              style={[s.planCard, selectedId === plan.id && s.planCardSelected]}>
              <View style={s.planHeader}>
                <View style={s.planIcon}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.planName}>{plan.name}</Text>
                  <Text style={s.planMeals}>{plan.mealsCount} meals total</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.planPrice}>₹{plan.price}</Text>
                  {!canAfford && <Text style={s.insufficientTag}>Top up needed</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {plans.length === 0 && !loading && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>No plans available right now</Text>
          </View>
        )}

        {/* Selected plan benefits */}
        {selected && (
          <View style={s.benefitsCard}>
            <Text style={s.benefitsTitle}>PLAN PRIVILEGES</Text>
            {getBenefits(selected).map((b: string, i: number) => (
              <View key={i} style={s.benefitRow}>
                <View style={s.benefitCheck}>
                  <Check size={14} color="#10B981" />
                </View>
                <Text style={s.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Start Date */}
        <View style={s.datePicker}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} color="#FF6B35" />
            <View>
              <Text style={s.dateLabel}>STARTS FROM</Text>
              <Text style={s.dateValue}>
                {new Date(Date.now()).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Included Messes */}
        {!messId && (
          <View style={s.datePicker}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>🏪</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.dateLabel}>INCLUDED MESSES</Text>
                <Text style={s.dateValue}>
                  {selectedMesses.length > 0 ? `${selectedMesses.length} Messes Selected` : 'All Messes (Global)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPicker(true)}>
                <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 13 }}>Customize</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Wallet deduction notice */}
        <Text style={s.terms}>
          ₹{selected?.price || 0} will be deducted from your Digi Mess Wallet. By confirming, you agree to our Terms of Service.
        </Text>
      </ScrollView>

      {/* Sticky Bottom */}
      <View style={s.bottomBar}>
        <View>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalPrice}>₹{selected?.price || 0}</Text>
        </View>
        <TouchableOpacity
          style={[s.confirmBtn, submitting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={submitting || !selected}
        >
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.confirmBtnText}>Confirm & Pay →</Text>}
        </TouchableOpacity>
      </View>

      {/* Mess Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowPicker(false)} style={s.backBtn}>
              <ArrowLeft size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Select up to 4 Messes</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {messes.map((item: any) => {
              const checked = selectedMesses.includes(item.id);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[s.messListItem, checked && s.messListItemSelected]}
                  onPress={() => {
                    if (checked) {
                      setSelectedMesses(prev => prev.filter(id => id !== item.id));
                    } else if (selectedMesses.length < 4) {
                      setSelectedMesses(prev => [...prev, item.id]);
                    } else {
                      if (Platform.OS === 'web') {
                        window.alert('You can only select up to 4 messes.');
                      } else {
                        Alert.alert('Limit Reached', 'You can only select up to 4 messes.');
                      }
                    }
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A' }}>{item.name}</Text>
                  {checked && <Check size={20} color="#FF6B35" />}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View style={{ padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#F1F5F9' }}>
            <TouchableOpacity style={s.confirmBtn} onPress={() => setShowPicker(false)}>
              <Text style={[s.confirmBtnText, { textAlign: 'center' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 6, letterSpacing: -0.3 },
  heroSub: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginBottom: 20 },
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statusCard: { flex: 1, borderRadius: 20, padding: 20, justifyContent: 'flex-end', minHeight: 120 },
  statusLabel: { fontSize: 10, fontWeight: '800', color: '#FF6B35', letterSpacing: 1, marginBottom: 4 },
  statusValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  planCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 10,
    borderWidth: 2, borderColor: '#F1F5F9',
  },
  planCardSelected: { borderColor: '#FF6B35', backgroundColor: '#FFFBF7' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  planMeals: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  planPrice: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  insufficientTag: { fontSize: 10, fontWeight: '700', color: '#EF4444', marginTop: 2 },
  benefitsCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginTop: 10, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  benefitsTitle: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  benefitCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  benefitText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  datePicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16,
  },
  dateLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  terms: { fontSize: 12, textAlign: 'center', color: '#94A3B8', fontWeight: '500', lineHeight: 18 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 8 },
      default: { boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' },
    }),
  },
  totalLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 2 },
  totalPrice: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  confirmBtn: {
    backgroundColor: '#FF6B35', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(255,107,53,0.3)' },
    }),
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  messListItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
    padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9'
  },
  messListItemSelected: { borderColor: '#FF6B35', backgroundColor: '#FFFBF7' },
});
