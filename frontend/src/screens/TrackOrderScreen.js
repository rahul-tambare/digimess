import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';

const COLORS = {
  primary: '#a14000',
  secondary: '#1b6d24',
  surface: '#faf9f8',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
};

const STEPS = [
  { id: 1, title: 'Order Placed', time: '12:30 PM', completed: true },
  { id: 2, title: 'Preparing Food', time: '12:35 PM', completed: true },
  { id: 3, title: 'Out for Delivery', time: 'Expected ~12:50 PM', completed: false },
  { id: 4, title: 'Delivered', time: 'Expected ~12:55 PM', completed: false }
];

export default function TrackOrderScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const orderId = route.params?.orderId;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack={true} noTopInset={false} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Track Order</Text>
        <Text style={styles.orderId}>Order ID: #{orderId?.slice(-6).toUpperCase() || 'TX-4592'}</Text>

        <View style={styles.statusBox}>
          {STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.indicatorCol}>
                <View style={[styles.dot, step.completed && styles.dotActive]} />
                {index !== STEPS.length - 1 && <View style={[styles.line, step.completed && styles.lineActive]} />}
              </View>
              <View style={styles.textCol}>
                <Text style={[styles.stepTitle, step.completed && styles.stepTitleActive]}>{step.title}</Text>
                <Text style={styles.stepTime}>{step.time}</Text>
              </View>
              {step.completed && <Text style={{fontSize: 18}}>✅</Text>}
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Delivery Details</Text>
          <Text style={styles.cardText}>Address: 123, Heritage Residency, Pune</Text>
          <Text style={styles.cardText}>Kitchen: Mother's Grace Mess</Text>
        </View>

        <TouchableOpacity 
          style={styles.supportBtn}
          onPress={() => alert('Support feature coming soon!')}
        >
          <Text style={styles.supportBtnText}>Need Help with Order?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface },
  orderId: { fontSize: 14, color: COLORS.onSurfaceVariant, marginBottom: 40, fontWeight: '600' },
  statusBox: { backgroundColor: '#fff', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  stepRow: { flexDirection: 'row', minHeight: 80 },
  indicatorCol: { width: 30, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#eee', zIndex: 1 },
  dotActive: { backgroundColor: COLORS.secondary },
  line: { width: 2, flex: 1, backgroundColor: '#eee', marginVertical: -4 },
  lineActive: { backgroundColor: COLORS.secondary },
  textCol: { flex: 1, paddingLeft: 16, marginTop: -4 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#ccc' },
  stepTitleActive: { color: COLORS.onSurface },
  stepTime: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, marginTop: 32, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  cardText: { fontSize: 14, color: COLORS.onSurfaceVariant },
  supportBtn: { marginTop: 40, alignSelf: 'center' },
  supportBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 }
});
