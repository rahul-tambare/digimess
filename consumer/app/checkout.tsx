import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Home, Wallet, CalendarCheck, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore, useUserStore, useOrderStore, useWalletStore } from '@/stores/dataStore';
import { subscriptionApi, configApi } from '@/services/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { messId, items, getTotal, clearCart } = useCartStore();
  const user = useUserStore(state => state.user);
  const address = user?.savedAddresses?.[0] || { type: 'home', pincode: '', line1: '', area: '', city: '' };
  const walletBalance = useWalletStore(state => state.balance);
  const [selectedPayment, setSelectedPayment] = useState('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [platformFee, setPlatformFee] = useState(2);

  React.useEffect(() => {
    useWalletStore.getState().fetchBalance();

    // Fetch real subscriptions
    subscriptionApi.getMySubscriptions().then((subs: any) => {
      const list = Array.isArray(subs) ? subs : (subs.subscriptions || []);
      // Find an active subscription for this mess
      const match = list.find((s: any) =>
        s.isActive && s.mealsRemaining > 0 && s.messId === messId
      );
      if (match) {
        setActiveSubscription({
          id: match.id,
          messId: match.messId,
          messName: match.messName || 'Subscribed Mess',
          mealsRemaining: match.mealsRemaining,
          isActive: true,
        });
      }
    }).catch(() => {});

    // Fetch delivery/platform fees from backend
    configApi.getCharges().then((res: any) => {
      if (res?.data) {
        setDeliveryFee(res.data.delivery ?? 20);
        setPlatformFee(res.data.platform ?? 2);
      }
    }).catch(() => {});
  }, []);

  const subtotal = getTotal();
  const grandTotal = subtotal + deliveryFee + platformFee;

  // Check if subscription applies to this mess
  const hasActiveSub = activeSubscription?.isActive &&
    activeSubscription?.mealsRemaining > 0 &&
    activeSubscription?.messId === messId;

  const handlePayment = async () => {
    setIsProcessing(true);

    if (selectedPayment === 'subscription') {
      try {
        await useOrderStore.getState().placeOrder({ paymentMethod: 'subscription', address: address ? `${address.line1}, ${address.area}` : '' });
        clearCart();
        router.replace('/order-success');
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to place order via subscription.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (selectedPayment === 'wallet') {
      if (walletBalance < grandTotal) {
        setIsProcessing(false);
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${grandTotal - walletBalance} more. Top up your wallet to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Top Up', onPress: () => router.push('/wallet-topup') },
          ]
        );
        return;
      }
    }

    try {
      await useOrderStore.getState().placeOrder({ paymentMethod: selectedPayment, address: address ? `${address.line1}, ${address.area}` : '' });
      clearCart();
      router.replace('/order-success');
    } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to place order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    ...(hasActiveSub ? [{
      id: 'subscription',
      name: `Use Subscription (${activeSubscription.mealsRemaining} meals left)`,
      emoji: '🎫',
      desc: `Free meal from ${activeSubscription.messName}`,
      highlight: true,
    }] : []),
    {
      id: 'wallet',
      name: 'Digi Mess Wallet',
      emoji: '💳',
      desc: `Balance: ₹${walletBalance.toLocaleString()}`,
      highlight: false,
    },
    { id: 'upi', name: 'Pay via UPI', emoji: '📱', desc: 'GPay, PhonePe, Paytm', highlight: false },
    { id: 'card', name: 'Credit / Debit Card', emoji: '💳', desc: 'Visa, Mastercard, RuPay', highlight: false },
    { id: 'cod', name: 'Cash on Delivery', emoji: '💵', desc: 'Pay at doorstep', highlight: false },
  ];

  const effectiveTotal = selectedPayment === 'subscription' ? 0 : grandTotal;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} disabled={isProcessing}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={s.cardTitle}>Delivery Address</Text>
            <TouchableOpacity><Text style={s.changeText}>Change</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={s.addrIcon}><Home size={18} color="#FF6B35" /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.addrType}>{address?.type.toUpperCase()} • {address?.pincode}</Text>
              <Text style={s.addrLine}>{address?.line1}, {address?.area}, {address?.city}</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Order Summary</Text>
          {items.map((item, idx) => (
            <View key={item.thaliId} style={[s.summaryRow, idx !== items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 10 }} />
                <Text style={s.summaryName}>{item.name} × {item.qty}</Text>
              </View>
              <Text style={s.summaryPrice}>₹{item.price * item.qty}</Text>
            </View>
          ))}
          <View style={s.billDivider} />
          <View style={s.billRow}><Text style={s.billLabel}>Item Total</Text><Text style={s.billValue}>₹{subtotal}</Text></View>
          <View style={s.billRow}><Text style={s.billLabel}>Delivery Fee</Text><Text style={s.billValue}>₹{deliveryFee}</Text></View>
          <View style={s.billRow}><Text style={s.billLabel}>Platform Fee</Text><Text style={s.billValue}>₹{platformFee}</Text></View>
          <View style={s.billDivider} />
          <View style={s.billRow}>
            <Text style={s.totalLabel}>To Pay</Text>
            <Text style={[s.totalValue, selectedPayment === 'subscription' && { textDecorationLine: 'line-through', color: '#94A3B8' }]}>₹{grandTotal}</Text>
          </View>
          {selectedPayment === 'subscription' && (
            <View style={s.freeMealBadge}>
              <Text style={s.freeMealText}>🎫 FREE — Using Subscription Meal</Text>
            </View>
          )}
        </View>

        {/* Subscribe Upsell - only if no active sub */}
        {!hasActiveSub && (
          <View style={s.upsellCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.upsellTitle}>Make it a habit & save 15%</Text>
              <Text style={s.upsellSub}>Subscribe to this mess for daily meals.</Text>
            </View>
            <TouchableOpacity style={s.upsellBtn} onPress={() => router.push('/subscription-plans')}>
              <Text style={s.upsellBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Methods */}
        <Text style={s.sectionTitle}>Select Payment Method</Text>
        <View style={s.card}>
          {paymentMethods.map((m, idx) => (
            <TouchableOpacity key={m.id} onPress={() => setSelectedPayment(m.id)}
              style={[s.payRow, idx !== paymentMethods.length - 1 && s.payRowBorder, m.highlight && s.payRowHighlight]}>
              <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[s.payName, m.highlight && { color: '#059669' }]}>{m.name}</Text>
                <Text style={s.payDesc}>{m.desc}</Text>
              </View>
              <View style={[s.radio, selectedPayment === m.id && s.radioActive]}>
                {selectedPayment === m.id && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Pay CTA */}
      <View style={s.ctaWrap}>
        <TouchableOpacity style={s.payBtn} onPress={handlePayment} disabled={isProcessing} activeOpacity={0.85}>
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={s.payBtnText}>
              {selectedPayment === 'subscription' ? 'Place Order (Free)' : `Pay ₹${effectiveTotal}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  changeText: { color: '#FF6B35', fontWeight: '700', fontSize: 13 },
  addrIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,53,0.08)', justifyContent: 'center', alignItems: 'center' },
  addrType: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  addrLine: { fontSize: 13, color: '#64748B', fontWeight: '500', lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  summaryPrice: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  billValue: { fontSize: 13, color: '#0F172A', fontWeight: '600' },
  billDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  freeMealBadge: {
    marginTop: 8, backgroundColor: '#ECFDF5', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, alignItems: 'center',
  },
  freeMealText: { fontSize: 13, fontWeight: '800', color: '#059669' },
  upsellCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#A7F3D0', borderStyle: 'dashed',
  },
  upsellTitle: { fontSize: 14, fontWeight: '800', color: '#065F46', marginBottom: 2 },
  upsellSub: { fontSize: 12, color: '#047857', fontWeight: '500' },
  upsellBtn: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginLeft: 12 },
  upsellBtnText: { color: '#FFF', fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 12, letterSpacing: -0.3 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  payRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  payRowHighlight: { backgroundColor: 'rgba(16,185,129,0.04)', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 12 },
  payName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  payDesc: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#FF6B35' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },
  ctaWrap: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  payBtn: {
    backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 8 },
      default: { boxShadow: '0 8px 24px rgba(255,107,53,0.35)' },
    }),
  },
  payBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
});
