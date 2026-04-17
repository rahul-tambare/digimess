import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { walletApi } from '@/services/api';
import { useWalletStore } from '@/stores/dataStore';
import { Alert, ActivityIndicator } from 'react-native';

export default function WalletTopUpScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);
    try {
      await walletApi.initiateTopUp(Number(amount), selectedMethod);
      await useWalletStore.getState().fetchBalance();
      await useWalletStore.getState().fetchTransactions(1);
      Alert.alert('Success', `₹${amount} added securely to your wallet!`);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Top up failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = ['500', '1000', '2000'];
  const methods = [
    { id: 'upi', name: 'UPI Transfer', desc: 'Google Pay, PhonePe, Paytm', emoji: '🏦' },
    { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', emoji: '💳' },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <X size={20} color="#475569" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Add Money</Text>
          <Text style={s.headerSub}>Instant top-up for your mess meals</Text>
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.label}>QUICK SELECT</Text>
        <View style={s.quickRow}>
          {quickAmounts.map((a) => (
            <TouchableOpacity key={a} onPress={() => setAmount(a)}
              style={[s.quickBtn, amount === a && s.quickBtnActive]}>
              <Text style={[s.quickBtnText, amount === a && s.quickBtnTextActive]}>₹{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>OR ENTER AMOUNT</Text>
        <View style={s.inputRow}>
          <Text style={s.currency}>₹</Text>
          <TextInput style={s.input} value={amount} onChangeText={setAmount}
            placeholder="0.00" keyboardType="numeric" placeholderTextColor="#CBD5E1" />
        </View>

        <Text style={s.label}>PAYMENT METHOD</Text>
        {methods.map((m) => (
          <TouchableOpacity key={m.id} onPress={() => setSelectedMethod(m.id)}
            style={[s.methodCard, selectedMethod === m.id && s.methodCardActive]}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.methodName}>{m.name}</Text>
              <Text style={s.methodDesc}>{m.desc}</Text>
            </View>
            <View style={[s.radio, selectedMethod === m.id && s.radioActive]}>
              {selectedMethod === m.id && <View style={s.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={[s.payBtn, (!amount || loading) && { opacity: 0.5 }]}
          onPress={handlePay} disabled={!amount || loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={s.payBtnText}>Proceed to Pay →</Text>
          )}
        </TouchableOpacity>
        <Text style={s.secureText}>🔒 SECURE 256-BIT ENCRYPTED TRANSACTION</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  quickBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
  },
  quickBtnActive: {
    backgroundColor: '#FF6B35', borderColor: '#FF6B35',
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(255,107,53,0.3)' },
    }),
  },
  quickBtnText: { fontWeight: '700', color: '#475569', fontSize: 15 },
  quickBtnTextActive: { fontWeight: '800', color: '#FFF' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#F1F5F9', paddingBottom: 12, marginBottom: 28 },
  currency: { fontSize: 28, fontWeight: '800', color: '#94A3B8', marginRight: 12 },
  input: { flex: 1, fontSize: 32, fontWeight: '800', color: '#0F172A', padding: 0 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#FFF',
  },
  methodCardActive: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  methodName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  methodDesc: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#FF6B35' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  payBtn: {
    backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
      default: { boxShadow: '0 6px 16px rgba(255,107,53,0.3)' },
    }),
  },
  payBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  secureText: { textAlign: 'center', fontSize: 10, color: '#94A3B8', fontWeight: '700', marginTop: 14, letterSpacing: 0.5 },
});
