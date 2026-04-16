import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, HelpCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(2), 5000);
    const t2 = setTimeout(() => setActiveStep(3), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const steps = [
    { title: 'Order Confirmed', time: '11:30 AM', desc: 'We have received your order.' },
    { title: 'Vendor Preparing', time: '11:35 AM', desc: 'Being prepared — ready in ~15 min' },
    { title: 'Out for Delivery', time: '12:05 PM', desc: 'Delivery partner is on the way.' },
    { title: 'Delivered', time: '12:30 PM', desc: 'Enjoy your meal!' },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/orders')} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Track Order</Text>
          <Text style={s.orderId}>#{id?.toUpperCase() || 'MW1042'}</Text>
        </View>
        <TouchableOpacity style={s.helpBtn}><HelpCircle size={20} color="#475569" /></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Map / Delivered State */}
        <View style={s.mapArea}>
          {activeStep < 3 ? (
            <>
              <Image source={{ uri: 'https://media.wired.com/photos/59269cd37034dc5f91bec0f1/191:100/w_1280,c_limit/GoogleMapTA.jpg' }} style={s.mapImage} resizeMode="cover" />
              <View style={s.driverCard}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?u=driver' }} style={s.driverAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.driverName}>Raju Delivery</Text>
                  <Text style={s.driverInfo}>⭐ 4.8 • Arriving in 15 mins</Text>
                </View>
                <TouchableOpacity style={s.callBtn}><Phone size={16} color="#10B981" /></TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={s.deliveredBanner}>
              <View style={s.checkCircle}><Text style={{ fontSize: 28, color: '#FFF' }}>✓</Text></View>
              <Text style={s.deliveredTitle}>Delivered!</Text>
              <Text style={s.deliveredSub}>Hope you enjoy your Ghar Jaisa Khana</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Order Status</Text>
          <View style={{ paddingLeft: 4 }}>
            {steps.map((step, idx) => {
              const isActive = idx === activeStep;
              const isPast = idx < activeStep;
              const isLast = idx === steps.length - 1;
              return (
                <View key={idx} style={[s.stepRow, !isLast && { marginBottom: 24 }]}>
                  {!isLast && <View style={[s.stepLine, isPast && { backgroundColor: '#FF6B35' }]} />}
                  <View style={[s.stepDot, isPast && s.stepDotPast, isActive && s.stepDotActive]}>
                    {isActive && <View style={s.stepDotInner} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[s.stepTitle, !(isPast || isActive) && { color: '#CBD5E1' }]}>{step.title}</Text>
                      {isPast && <Text style={s.stepTime}>{step.time}</Text>}
                    </View>
                    {isActive && <Text style={s.stepDesc}>{step.desc}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Order Details</Text>
          <View style={s.detailRow}><Text style={s.detailLabel}>Items</Text><Text style={s.detailValue}>2x Full Maharashtrian Thali</Text></View>
          <View style={s.detailRow}><Text style={s.detailLabel}>Total</Text><Text style={s.detailValue}>₹262 (Paid via UPI)</Text></View>
          <View style={s.detailRow}><Text style={s.detailLabel}>Delivery</Text><Text style={s.detailValue}>Flat 12, Arjun Heights, Kothrud</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  orderId: { fontSize: 12, color: '#FF6B35', fontWeight: '700' },
  helpBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  mapArea: { height: 240, backgroundColor: '#F1F5F9', position: 'relative' },
  mapImage: { width: '100%', height: '100%', opacity: 0.6 },
  driverCard: {
    position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    }),
  },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
  driverName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  driverInfo: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  deliveredBanner: { flex: 1, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deliveredTitle: { fontSize: 24, fontWeight: '800', color: '#065F46' },
  deliveredSub: { fontSize: 14, color: '#047857', fontWeight: '500', marginTop: 4 },
  card: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 20, letterSpacing: -0.3 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  stepLine: { position: 'absolute', left: 7, top: 20, bottom: -28, width: 2, backgroundColor: '#E2E8F0' },
  stepDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#E2E8F0',
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  stepDotPast: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  stepDotActive: { borderColor: '#FF6B35' },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  stepTime: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  stepDesc: { fontSize: 13, color: '#FF6B35', fontWeight: '600', marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
});
