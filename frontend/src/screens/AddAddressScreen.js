import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#a14000',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e3e2e1',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  outlineVariant: '#e0c0b2'
};

export default function AddAddressScreen({ navigation }) {
  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const handleSave = async () => {
    if (!addressLine || !area || !city || !pincode) {
      Alert.alert('Missing Fields', 'Please fill in all address details.');
      return;
    }

    const newAddress = {
      id: Date.now().toString(),
      label,
      description: `${addressLine}, ${area}, ${city} ${pincode}`
    };

    try {
      const savedAddressesJSON = await AsyncStorage.getItem('@addresses');
      let savedAddresses = [];
      if (savedAddressesJSON) {
        savedAddresses = JSON.parse(savedAddressesJSON);
      }
      
      savedAddresses.push(newAddress);
      await AsyncStorage.setItem('@addresses', JSON.stringify(savedAddresses));
      
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save address. Please try again.');
      console.error(e);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{fontSize: 24, color: COLORS.onSurface}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Address</Text>
        <View style={{width: 44}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.sectionLabel}>SAVE AS</Text>
        <View style={styles.labelRow}>
          {['Home', 'Work', 'Other'].map(l => (
            <TouchableOpacity 
              key={l} 
              style={[styles.labelChip, label === l && styles.labelChipActive]}
              onPress={() => setLabel(l)}
            >
              <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ADDRESS DETAILS</Text>
        <View style={styles.inputGroup}>
          <TextInput 
            style={styles.input} 
            placeholder="Flat, House no., Building, Company"
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={addressLine}
            onChangeText={setAddressLine}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Area, Street, Sector, Village"
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={area}
            onChangeText={setArea}
          />
          <View style={{flexDirection: 'row', gap: 12}}>
            <TextInput 
              style={[styles.input, {flex: 1}]} 
              placeholder="City"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={city}
              onChangeText={setCity}
            />
            <TextInput 
              style={[styles.input, {flex: 1}]} 
              placeholder="Pincode"
              placeholderTextColor={COLORS.onSurfaceVariant}
              keyboardType="number-pad"
              value={pincode}
              onChangeText={setPincode}
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Address</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 60, paddingBottom: 20, backgroundColor: COLORS.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  scrollContent: { padding: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 1, marginBottom: 16, marginTop: 24 },
  labelRow: { flexDirection: 'row', gap: 12 },
  labelChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: COLORS.surfaceContainerLow, borderWidth: 1, borderColor: COLORS.outlineVariant },
  labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelChipText: { fontSize: 14, fontWeight: '700', color: COLORS.onSurfaceVariant },
  labelChipTextActive: { color: '#ffffff' },
  inputGroup: { gap: 16 },
  input: { backgroundColor: COLORS.surfaceContainerLowest, padding: 16, borderRadius: 16, fontSize: 16, color: COLORS.onSurface, borderWidth: 1, borderColor: COLORS.outlineVariant },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: COLORS.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainerHighest },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 32, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '800' }
});
