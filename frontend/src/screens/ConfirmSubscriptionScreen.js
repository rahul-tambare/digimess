import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, StatusBar, Platform, ActivityIndicator, Alert } from 'react-native';
import api from '../utils/api';
import Header from '../components/Header';
import { useCart } from '../utils/CartContext';



const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  outline: '#8c7166'
};


const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

export default function ConfirmSubscriptionScreen({ navigation }) {
  const [plans, setPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/plans');
        setPlans(response.data);
        // Select first plan by default
        const allPlans = Object.values(response.data).flat();
        if (allPlans.length > 0) {
          setSelectedPlan(allPlans[0]);
        }
      } catch (e) {
        console.error('Failed to fetch plans', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} style={{ backgroundColor: 'transparent', borderBottomWidth: 0 }} />
      <View style={styles.bgHeader}>
        <Text style={styles.pageTitle}>My Subscription</Text>
        <Text style={styles.pageSubtitle}>Manage your daily culinary experience.</Text>
        
        <View style={styles.bgGrid}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>CURRENT STATUS</Text>
            <Text style={styles.statusValue}>No Active Plan</Text>
          </View>
          <View style={styles.walletCard}>
            <Text style={{fontSize: 24, marginBottom: 8}}>💳</Text>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletValue}>₹4,250</Text>
          </View>
        </View>
      </View>

      {/* Scrim */}
      <View style={styles.scrim} />

      {/* Bottom Sheet Modal Representation */}
      <View style={[styles.sheet, { paddingBottom: Math.max(STATUSBAR_HEIGHT, 20) }]}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Confirm Subscription</Text>
            <Text style={styles.sheetSubtitle}>Review your fresh meal journey details.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={{fontSize: 18, color: COLORS.onSurfaceVariant}}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
          {/* Plans Selection */}
          <Text style={styles.benefitsTitle}>AVAILABLE PLANS</Text>
          {Object.entries(plans).map(([category, categoryPlans]) => (
            <View key={category} style={{marginBottom: 16}}>
              <Text style={{fontSize: 12, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8}}>{category.toUpperCase()}</Text>
              {categoryPlans.map((plan) => (
                <TouchableOpacity 
                  key={plan.id} 
                  style={[styles.planCard, selectedPlan?.id === plan.id && { borderColor: COLORS.primary, borderWidth: 2 }]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <View style={styles.planCardContent}>
                    <View style={styles.planIcon}><Text style={{fontSize:24}}>🍽️</Text></View>
                    <View style={{flex: 1}}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planFreq}>{plan.mealsCount} meals total</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.planPrice}>₹{plan.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Benefits of Selected Plan */}
          {selectedPlan && (
            <>
              <Text style={styles.benefitsTitle}>PLAN PRIVILEGES</Text>
              <View style={styles.benefitsGrid}>
                {selectedPlan.benefits && selectedPlan.benefits.map((benefit, idx) => (
                  <View key={idx} style={styles.benefitItem}>
                    <View style={styles.benefitIcon}><Text>✅</Text></View>
                    <View style={{flex: 1}}>
                      <Text style={styles.benefitName}>{benefit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Start Date */}
          <View style={styles.datePicker}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <Text style={{fontSize: 20}}>📅</Text>
              <View>
                <Text style={styles.dateLabel}>STARTS FROM</Text>
                <Text style={styles.dateValue}>Monday, Oct 24, 2026</Text>
              </View>
            </View>
            <TouchableOpacity><Text style={styles.changeDate}>Change Date</Text></TouchableOpacity>
          </View>

          {/* Action */}
          <TouchableOpacity 
            style={[styles.confirmBtn, (!selectedPlan || submitting) && { opacity: 0.5 }]} 
            onPress={async () => {
              if (!selectedPlan) return;
              try {
                setSubmitting(true);
                const res = await api.post('/user/subscriptions', {
                  planId: selectedPlan.id,
                  amount: selectedPlan.price,
                  mealsCount: selectedPlan.mealsCount
                });
                navigation.navigate('OrderSuccess', { isSubscription: true, subscriptionId: res.data.subscriptionId });
              } catch (e) {
                console.error(e);
                const errorMsg = e.response?.data?.error || 'Failed to purchase subscription';
                if (errorMsg === 'Insufficient wallet balance') {
                  const shortfall = e.response?.data?.shortfall;
                  Alert.alert(
                    'Insufficient Balance',
                    'Your wallet balance is too low to purchase this subscription.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Top Up', onPress: () => navigation.navigate('WalletTopUp', { amount: shortfall ? Math.ceil(shortfall) : '' }) }
                    ]
                  );
                } else {
                  Alert.alert('Error', errorMsg);
                }
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!selectedPlan || submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm & Pay →</Text>}
          </TouchableOpacity>
          <Text style={styles.terms}>By confirming, you agree to our Terms of Service. Payment will be deducted from your Digi Mess Wallet.</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  bgHeader: { paddingHorizontal: 24, paddingBottom: 24 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface },
  pageSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, marginBottom: 24 },
  bgGrid: { flexDirection: 'row', gap: 16 },
  statusCard: { flex: 2, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 24, padding: 24, justifyContent: 'flex-end', height: 160 },
  statusLabel: { fontSize: 12, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  statusValue: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  walletCard: { flex: 1, backgroundColor: COLORS.primaryContainer, borderRadius: 24, padding: 24, height: 160 },
  walletLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  walletValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 8 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,28,28,0.4)', zIndex: 10 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 32, zIndex: 20, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  sheetTitle: { fontSize: 28, fontWeight: '800', color: COLORS.onSurface },
  sheetSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  closeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  planCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 24, padding: 24, marginBottom: 24 },
  planCardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  planIcon: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  planLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  planName: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  planPrice: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  planFreq: { fontSize: 12, color: COLORS.onSurfaceVariant },
  benefitsTitle: { fontSize: 12, fontWeight: '800', color: COLORS.onSurfaceVariant, marginBottom: 16 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  benefitItem: { width: '48%', backgroundColor: COLORS.surfaceContainerLowest, borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(160,243,153,0.3)', alignItems: 'center', justifyContent: 'center' },
  benefitName: { fontSize: 13, fontWeight: 'bold', color: COLORS.onSurface, flex: 1 },
  benefitDesc: { fontSize: 10, color: COLORS.onSurfaceVariant },
  datePicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 24, borderRadius: 24, marginBottom: 32 },
  dateLabel: { fontSize: 10, fontWeight: '800', color: COLORS.onSurfaceVariant, marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.onSurface },
  changeDate: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  confirmBtn: { backgroundColor: COLORS.primary, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 16 },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  terms: { fontSize: 11, textAlign: 'center', color: COLORS.onSurfaceVariant, paddingHorizontal: 20 },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 16, marginBottom: 8 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  cartItemPrice: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 16 }
});
