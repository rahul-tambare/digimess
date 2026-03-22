import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';

const COLORS = {
  primary: '#a14000',
  secondary: '#1b6d24',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  primaryFixed: '#ffdbcc'
};

export default function MySubscriptionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await api.get('/user/subscriptions');
        setSubscriptions(res.data);
      } catch (err) {
        console.error('Error fetching subscriptions', err);
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = navigation.addListener('focus', fetchSubs);
    fetchSubs();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack={true} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingBottom: 100}}>
        <Text style={styles.pageTitle}>My Subscriptions</Text>
        <Text style={styles.pageSubtitle}>Manage your active and past meal plans.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 40}} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{fontSize: 64, marginBottom: 16}}>🍽️</Text>
            <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
            <Text style={styles.emptyDesc}>You haven't subscribed to any mess yet. Discover a plan that suits your daily needs!</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('ConfirmSubscription')}>
              <Text style={styles.exploreBtnText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {subscriptions.map(sub => {
              const isActive = sub.isActive && new Date(sub.endDate) >= new Date();
              return (
                <View key={sub.id} style={[styles.card, isActive && { borderColor: COLORS.primaryFixed, borderWidth: 2 }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrap}>
                      <Text style={{fontSize: 24}}>🥘</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.planType}>{sub.type === 'multi_mess' ? 'Digi Mess Pro Pass' : (sub.messName || 'Single Mess Plan')}</Text>
                      <Text style={styles.dates}>{new Date(sub.startDate).toLocaleDateString()} to {new Date(sub.endDate).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>MEALS REMAINING</Text>
                      <Text style={styles.statValue}>{sub.mealsRemaining}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>STATUS</Text>
                      <Text style={[styles.statValue, isActive ? {color: COLORS.secondary} : {color: COLORS.onSurfaceVariant}]}>
                        {isActive ? 'ACTIVE' : 'EXPIRED'}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  pageTitle: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface },
  pageSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, marginBottom: 32, marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 },
  exploreBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  list: { gap: 16 },
  card: { backgroundColor: COLORS.surfaceContainerLowest, padding: 24, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  iconWrap: { width: 56, height: 56, borderRadius: 20, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  planType: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  dates: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 16 },
  statLabel: { fontSize: 10, fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: COLORS.onSurface }
});
