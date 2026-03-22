import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#a14000',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  primaryContainer: '#f26d21',
  primaryFixed: '#ffdbcc'
};

export default function OrderSuccessScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isSubscription, orderId } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={{fontSize: 24}}>🍽️</Text>
        <Text style={styles.headerTitle}>Digi Mess</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={{fontSize: 64}}>✅</Text>
        </View>
        <Text style={styles.successTitle}>Success!</Text>
        <Text style={styles.successDesc}>Your culinary journey begins now.</Text>

        <View style={styles.orderCard}>
          <View style={styles.orderCardHeader}>
            <View>
              <Text style={styles.metaLabel}>ORDER ID</Text>
              <Text style={styles.metaValue}>#{orderId ? orderId.slice(-6).toUpperCase() : 'SUB-8912'}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={[styles.metaLabel, {color: COLORS.secondaryContainer}]}>ESTIMATED DELIVERY</Text>
              <Text style={styles.metaValue}>Today, 12:30 PM</Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>ORDER SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Image 
              source={{uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAERO5Q8Sd-S2uneJZyVsV2JsyuFepeRvNPXcqgxwDQTOwaFkuMFyryjMH-EZmSjwKSVaXeMhlo-U2VzmtNLVcroMwObVgssnwBydcIp3VnLlmnHN931ykVnASYfLvf5J3yUYneLUo8QJQGCWPzX69W5Khg-tv5m1nJ2aZIWS3VU-3lI-HPF8C8RuJW13NIc2McVqJgsDWE6sRkpEufo_vCTZbTL9RdUQyW6eF8RbLTVOqeD2nr8ZytxjTIiUdZ2mx2jy5iuenfNbg'}}
              style={styles.summaryImg}
            />
            <View style={{flex: 1}}>
              <View style={styles.summaryTitleRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.summaryTitle}>{isSubscription ? 'Subscription Purchased' : 'Food Order Confirmed'}</Text>
                  <Text style={styles.summarySubtitle}>{isSubscription ? 'Monthly Plan' : 'Your Selected Meals'}</Text>
                </View>
                <Text style={styles.summaryPrice}>Paid ✓</Text>
              </View>
              <View style={styles.tagsRow}>
                <View style={styles.tagGreen}><Text style={styles.tagGreenText}>HEALTHY</Text></View>
                <View style={styles.tagOrange}><Text style={styles.tagOrangeText}>ORGANIC</Text></View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.trackBtn}
          onPress={() => {
            if (isSubscription) {
              navigation.navigate('TransactionHistory');
            } else {
              navigation.navigate('TrackOrder', { orderId });
            }
          }}
        >
          <Text style={styles.trackBtnText}>
            {isSubscription ? '🗺️ View Transactions' : '🗺️ Track Order'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primaryContainer },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 120, height: 120, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, transform: [{rotate: '-3deg'}] },
  successTitle: { fontSize: 40, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  successDesc: { fontSize: 16, color: COLORS.onSurfaceVariant, marginBottom: 40 },
  orderCard: { width: '100%', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 32, padding: 24, marginBottom: 32 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 24, marginBottom: 24 },
  metaLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  metaValue: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: COLORS.onSurfaceVariant, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 16 },
  summaryImg: { width: 80, height: 80, borderRadius: 16 },
  summaryTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  summarySubtitle: { fontSize: 12, color: COLORS.onSurfaceVariant },
  summaryPrice: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  tagsRow: { flexDirection: 'row', gap: 8 },
  tagGreen: { backgroundColor: 'rgba(160,243,153,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  tagGreenText: { fontSize: 10, fontWeight: '800', color: '#005312' },
  tagOrange: { backgroundColor: COLORS.primaryFixed, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  tagOrangeText: { fontSize: 10, fontWeight: '800', color: '#7b2f00' },
  trackBtn: { width: '100%', backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 32, alignItems: 'center', marginBottom: 16 },
  trackBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  homeBtn: { width: '100%', backgroundColor: '#e3e2e1', paddingVertical: 18, borderRadius: 32, alignItems: 'center' },
  homeBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '800' }
});
