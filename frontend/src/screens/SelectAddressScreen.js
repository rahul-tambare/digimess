import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  outlineVariant: '#e0c0b2',
  primaryFixed: '#ffdbcc'
};

const BOTTOM_PAD = Platform.OS === 'android' ? 16 : 32;

const iconFor = (label) => label === 'Work' ? '🏢' : label === 'Home' ? '🏠' : '📍';

export default function SelectAddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/addresses');
      const list = res.data || [];
      setAddresses(list);
      // auto-select the default or first address
      const def = list.find(a => a.isDefault) || list[0];
      if (def) setSelectedId(def.id);
    } catch (e) {
      console.error('Failed to load addresses:', e);
      Alert.alert('Error', 'Could not load saved addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/user/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a.id !== id));
            if (selectedId === id) setSelectedId(null);
          } catch (e) {
            Alert.alert('Error', 'Could not delete address.');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scrim} />
      
      <View style={[styles.modal, { paddingBottom: BOTTOM_PAD }]}>
        <View style={styles.handle} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Select Delivery Address</Text>
          <Text style={styles.subtitle}>Choose where you'd like your meal delivered today.</Text>
        </View>

        {loading ? (
          <View style={{padding: 40, alignItems: 'center'}}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView style={styles.body} contentContainerStyle={{gap: 12, paddingBottom: 20}}>
            {addresses.length === 0 && (
              <Text style={{color: COLORS.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic', paddingVertical: 16}}>
                No saved addresses yet.
              </Text>
            )}
            {addresses.map(addr => {
              const isActive = selectedId === addr.id;
              const description = [addr.addressLine, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={isActive ? styles.addressCardActive : styles.addressCard}
                  onPress={() => setSelectedId(addr.id)}
                  onLongPress={() => handleDelete(addr.id)}
                >
                  <View style={styles.addressLeft}>
                    <View style={[styles.addressIcon, {backgroundColor: isActive ? COLORS.primaryFixed : COLORS.surfaceContainerHighest}]}>
                      <Text>{iconFor(addr.label)}</Text>
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressName}>{addr.label}</Text>
                      <Text style={styles.addressDesc}>{description}</Text>
                    </View>
                  </View>
                  {isActive
                    ? <View style={styles.radioActive}><View style={styles.radioInner} /></View>
                    : <View style={styles.radioInactive} />
                  }
                </TouchableOpacity>
              );
            })}

            {/* Add New */}
            <TouchableOpacity style={styles.addNewBtn} onPress={() => navigation.navigate('AddAddress')}>
              <Text style={{fontSize: 20}}>➕</Text>
              <Text style={styles.addNewText}>Add New Address</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.actionBtnText}>Deliver to this Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,28,28,0.4)' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 16 },
  handle: { width: 48, height: 6, backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  header: { paddingHorizontal: 32, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant },
  body: { paddingHorizontal: 32, gap: 12 },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, borderRadius: 24, backgroundColor: COLORS.surfaceContainerLow, borderWidth: 2, borderColor: 'transparent' },
  addressCardActive: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, borderRadius: 24, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 2, borderColor: COLORS.primaryContainer },
  addressLeft: { flexDirection: 'row', flex: 1, paddingRight: 16 },
  addressIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  addressInfo: { flex: 1 },
  addressName: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  addressDesc: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 20 },
  radioActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryContainer },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  radioInactive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.outlineVariant },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 24, borderWidth: 2, borderColor: COLORS.outlineVariant, borderStyle: 'dashed', gap: 12, marginTop: 8 },
  addNewText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  footer: { paddingHorizontal: 32, paddingTop: 32 },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: 32, paddingVertical: 20, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }
});
