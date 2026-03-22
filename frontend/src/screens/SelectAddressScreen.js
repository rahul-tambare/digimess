import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


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

export default function SelectAddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([
    { id: '1', label: 'Home', description: '24th Avenue, Sterling Apartments, Block B, Floor 4, Bangalore 560001', icon: '🏠' },
    { id: '2', label: 'Work', description: 'Tech Park One, Tower C, 8th Floor, Whitefield, Bangalore 560066', icon: '🏢' }
  ]);
  const [selectedId, setSelectedId] = useState('1');

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const saved = await AsyncStorage.getItem('@addresses');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAddresses(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newAddrs = parsed.filter(a => !existingIds.has(a.id));
            return [...prev, ...newAddrs.map(a => ({...a, icon: a.label === 'Work' ? '🏢' : a.label === 'Home' ? '🏠' : '📍'}))];
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    const unsubscribe = navigation.addListener('focus', loadAddresses);
    loadAddresses();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.scrim} />
      
      <View style={[styles.modal, { paddingBottom: BOTTOM_PAD }]}>
        <View style={styles.handle} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Select Delivery Address</Text>
          <Text style={styles.subtitle}>Choose where you'd like your meal delivered today.</Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{gap: 12, paddingBottom: 20}}>
          {addresses.map(addr => {
            const isActive = selectedId === addr.id;
            return (
              <TouchableOpacity key={addr.id} style={isActive ? styles.addressCardActive : styles.addressCard} onPress={() => setSelectedId(addr.id)}>
                <View style={styles.addressLeft}>
                  <View style={[styles.addressIcon, {backgroundColor: isActive ? COLORS.primaryFixed : COLORS.surfaceContainerHighest}]}><Text>{addr.icon}</Text></View>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>{addr.label}</Text>
                    <Text style={styles.addressDesc}>{addr.description}</Text>
                  </View>
                </View>
                {isActive ? <View style={styles.radioActive}><View style={styles.radioInner} /></View> : <View style={styles.radioInactive} />}
              </TouchableOpacity>
            )
          })}

          {/* Add New */}
          <TouchableOpacity style={styles.addNewBtn} onPress={() => navigation.navigate('AddAddress')}>
            <Text style={{fontSize: 20}}>➕</Text>
            <Text style={styles.addNewText}>Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>

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
