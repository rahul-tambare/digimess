import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Trash2, Star } from 'lucide-react-native';
import { addressApi } from '@/services/api';

interface Address {
  id: string;
  label: string;
  addressLine: string;
  area?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export default function ManageAddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await addressApi.getAddresses();
      const data = Array.isArray(res) ? res : (res.addresses || res.data || []);
      setAddresses(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await addressApi.deleteAddress(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressApi.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to set default address');
    }
  };

  const renderItem = ({ item }: { item: Address }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labelBadge}>
          <MapPin size={14} color="#FF6B35" />
          <Text style={styles.labelText}>{item.label}</Text>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Star size={12} color="#FF6B35" />
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressText}>{item.addressLine}</Text>
      {item.area && <Text style={styles.subText}>{item.area}</Text>}
      <Text style={styles.subText}>{item.city} — {item.pincode}</Text>
      <View style={styles.actions}>
        {!item.isDefault && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item.id)} activeOpacity={0.7}>
            <Text style={styles.actionBtnText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} activeOpacity={0.7}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Addresses</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <MapPin size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Addresses Saved</Text>
          <Text style={styles.emptySubtitle}>Add an address during checkout to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
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
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  labelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,53,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  labelText: { fontSize: 13, fontWeight: '700', color: '#FF6B35' },
  defaultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,107,53,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  defaultText: { fontSize: 11, fontWeight: '700', color: '#FF6B35' },
  addressText: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  subText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, gap: 12 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: '#FEF2F2' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
});
