import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import api from '../utils/api';


const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e3e2e1',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  primaryFixedDim: '#ffb694',
  outlineVariant: '#e0c0b2'
};

const BOTTOM_PAD = Platform.OS === 'android' ? 16 : 32;

export default function WalletTopUpScreen({ route, navigation }) {
  const [amount, setAmount] = useState(route?.params?.amount ? String(route.params.amount) : '');
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/config');
        setConfig(response.data);
      } catch (e) {
        console.error('Failed to fetch config', e);
      }
    };
    fetchConfig();
  }, []);


  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
    }
    setLoading(true);
    try {
      await api.post('/wallet/topup', { amount: numAmount });
      Alert.alert('Success', `${config.currencySymbol || '₹'}${numAmount.toFixed(2)} added to your wallet!`);
      // Use navigation.goBack() or reset route to refresh wallet balance
      navigation.goBack();
    } catch (err) {
      console.log('Error topping up:', err);
      Alert.alert('Error', 'Failed to add money. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.scrim} />
      
      <View style={[styles.modal, { paddingBottom: BOTTOM_PAD }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Add Money</Text>
            <Text style={styles.subtitle}>Instant top-up for your mess meals</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={{fontSize: 20, color: COLORS.onSurfaceVariant}}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Quick Add */}
          <Text style={styles.label}>QUICK SELECT</Text>
          <View style={styles.quickSelectRow}>
            <TouchableOpacity style={amount === '500' ? styles.quickBtnActive : styles.quickBtn} onPress={() => setAmount('500')}><Text style={amount === '500' ? styles.quickBtnTextActive : styles.quickBtnText}>{config.currencySymbol || '₹'}500</Text></TouchableOpacity>
            <TouchableOpacity style={amount === '1000' ? styles.quickBtnActive : styles.quickBtn} onPress={() => setAmount('1000')}><Text style={amount === '1000' ? styles.quickBtnTextActive : styles.quickBtnText}>{config.currencySymbol || '₹'}1000</Text></TouchableOpacity>
            <TouchableOpacity style={amount === '2000' ? styles.quickBtnActive : styles.quickBtn} onPress={() => setAmount('2000')}><Text style={amount === '2000' ? styles.quickBtnTextActive : styles.quickBtnText}>{config.currencySymbol || '₹'}2000</Text></TouchableOpacity>
          </View>

          {/* Input Amount */}
          <Text style={styles.label}>OR ENTER AMOUNT</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.currency}>{config.currencySymbol || '₹'}</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" placeholderTextColor={COLORS.surfaceContainerHighest} />
          </View>

          {/* Payment Method */}
          <Text style={styles.label}>PAYMENT METHOD</Text>
          <View style={styles.methodList}>
            <TouchableOpacity style={styles.methodCardActive}>
              <View style={[styles.methodIcon, {backgroundColor: COLORS.surfaceContainerLowest}]}><Text>🏦</Text></View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>UPI Transfer</Text>
                <Text style={styles.methodDesc}>Google Pay, PhonePe, Paytm</Text>
              </View>
              <View style={styles.radioActive}><View style={styles.radioInner} /></View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.methodCard}>
              <View style={[styles.methodIcon, {backgroundColor: COLORS.surfaceContainerLow}]}><Text>💳</Text></View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Credit / Debit Card</Text>
                <Text style={styles.methodDesc}>Visa, Mastercard, RuPay</Text>
              </View>
              <View style={styles.radioInactive} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.payBtn, loading && {opacity:0.7}]} onPress={handleTopUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Proceed to Pay →</Text>}
          </TouchableOpacity>
          <Text style={styles.secureText}>🔒 SECURE 256-BIT ENCRYPTED TRANSACTION</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,28,28,0.4)' },
  modal: { backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.onSurface },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 32, paddingVertical: 24, gap: 24 },
  label: { fontSize: 10, fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 1 },
  quickSelectRow: { flexDirection: 'row', gap: 12 },
  quickBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, flex: 1, alignItems: 'center' },
  quickBtnText: { fontWeight: '600', color: COLORS.onSurface },
  quickBtnActive: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.primaryContainer, borderRadius: 16, flex: 1, alignItems: 'center', shadowColor: COLORS.primaryContainer, shadowOffset:{width:0, height:4}, shadowOpacity:0.3, shadowRadius:8 },
  quickBtnTextActive: { fontWeight: '800', color: '#fff' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.surfaceContainerHighest, paddingBottom: 12 },
  currency: { fontSize: 28, fontWeight: '800', color: COLORS.onSurfaceVariant, marginRight: 16 },
  input: { flex: 1, fontSize: 32, fontWeight: '800', color: COLORS.onSurface, padding: 0 },
  methodList: { gap: 12 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerLowest },
  methodCardActive: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'transparent', backgroundColor: COLORS.surfaceContainerLow },
  methodIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  methodDesc: { fontSize: 12, color: COLORS.onSurfaceVariant },
  radioActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  radioInactive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.surfaceContainerHighest },
  footer: { paddingHorizontal: 32, paddingTop: 16 },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: 32, paddingVertical: 20, alignItems: 'center', overflow: 'hidden' },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secureText: { textAlign: 'center', fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: '800', marginTop: 16, opacity: 0.6 }
});
