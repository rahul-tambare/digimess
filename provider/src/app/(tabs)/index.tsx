import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../../utils/api';

export default function DashboardScreen() {
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [messesRes, forecastRes] = await Promise.all([
        api.get('/messes/provider/my-messes'),
        api.get('/orders/provider/forecast').catch(() => null)
      ]);
      setMesses(messesRes.data);
      if (forecastRes) setForecast(forecastRes.data.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Provider</Text>
      
      {forecast && (
        <View style={styles.forecastCard}>
          <Text style={styles.forecastTitle}>🎯 Today's Kitchen Target</Text>
          <Text style={styles.forecastMetric}>{forecast.totalMealsToPrepare} Meals</Text>
          <Text style={styles.forecastSubtext}>From {forecast.activeSubscriptionsToday} Subscriptions + {forecast.pendingOnDemandOrders} On-Demand Orders</Text>
        </View>
      )}

      <Text style={styles.subtitle}>Your Messes</Text>
      <FlatList
        data={messes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.messName}>{item.name}</Text>
            <Text style={styles.status}>Status: {item.isOpen ? '🟢 Open' : '🔴 Closed'}</Text>
            {item.address && <Text>📍 {item.address}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text>You have not registered any messes yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  forecastCard: { padding: 20, backgroundColor: '#007AFF', borderRadius: 8, marginBottom: 20, elevation: 3 },
  forecastTitle: { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 5 },
  forecastMetric: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  forecastSubtext: { fontSize: 12, color: '#e0e0e0', marginTop: 5 },
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, elevation: 2 },
  messName: { fontSize: 18, fontWeight: 'bold' },
  status: { marginTop: 5, color: '#555', fontWeight: '500' }
});
