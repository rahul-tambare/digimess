import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import api from '../../utils/api';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/provider/my-orders');
      setOrders(res.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders(); // Refresh
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update order');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
            <Text>Customer: {item.customerName} ({item.customerPhone})</Text>
            <Text>Type: {item.orderType}</Text>
            <Text>Status: {item.status.toUpperCase()}</Text>
            
            <View style={styles.actions}>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item.id, 'preparing')}>
                  <Text style={styles.btnText}>Accept & Prepare</Text>
                </TouchableOpacity>
              )}
              {item.status === 'preparing' && (
                <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item.id, 'out_for_delivery')}>
                  <Text style={styles.btnText}>Dispatch</Text>
                </TouchableOpacity>
              )}
              {item.status === 'out_for_delivery' && (
                <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item.id, 'delivered')}>
                  <Text style={styles.btnText}>Mark Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No recent orders found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, elevation: 2 },
  orderId: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  actions: { flexDirection: 'row', marginTop: 10, gap: 10 },
  btn: { backgroundColor: '#007AFF', padding: 8, borderRadius: 5 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
