import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react-native';

export default function PaymentMethodsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.center}>
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <CreditCard size={28} color="#FF6B35" />
          </View>
          <View style={styles.iconCircle}>
            <Smartphone size={28} color="#FF6B35" />
          </View>
        </View>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          We're working on adding saved cards and UPI payment methods. For now, you can pay via wallet, UPI, or cash on delivery during checkout.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center', lineHeight: 21 },
});
