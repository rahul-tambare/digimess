import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../../utils/api';

export default function NotificationsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/notifications/logs');
      setLogs(res.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isRead && styles.unread]}>
            <Text style={styles.logTitle}>{item.title}</Text>
            <Text style={styles.logBody}>{item.body}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No recent notifications.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, elevation: 1 },
  unread: { borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  logTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  logBody: { fontSize: 14, color: '#333', marginBottom: 10 },
  date: { fontSize: 12, color: '#888' }
});
