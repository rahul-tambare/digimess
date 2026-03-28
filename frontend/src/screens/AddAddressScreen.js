import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from '../components/ExpoMap';
import api from '../utils/api';

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
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState(18.5204); // Default to Pune
  const [longitude, setLongitude] = useState(73.8567);
  const [region, setRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const handleGetCurrentLocation = async () => {
    try {
      setLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = location.coords;
      updateLocation(lat, lng);
      
      // Center map
      setRegion({
        ...region,
        latitude: lat,
        longitude: lng,
      });

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const updateLocation = async (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    try {
      let [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (addr) {
        setAddressLine(addr.name || addr.street || '');
        setArea(addr.district || addr.subregion || '');
        setCity(addr.city || addr.subregion || '');
        setPincode(addr.postalCode || '');
      }
    } catch (e) {
      console.log('Reverse geocoding failed', e);
    }
  };

  const handleMapPress = (e) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    updateLocation(lat, lng);
  };

  const handleSave = async () => {
    if (!addressLine || !city || !pincode) {
      Alert.alert('Missing Fields', 'Please fill in required address details (Address, City, Pincode).');
      return;
    }

    try {
      setSaving(true);
      await api.post('/user/addresses', { 
        label, 
        addressLine, 
        area, 
        city, 
        pincode,
        latitude,
        longitude
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.error || 'Failed to save address. Please try again.');
    } finally {
      setSaving(false);
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

        <Text style={styles.sectionLabel}>PICK LOCATION ON MAP</Text>
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            <Marker 
              coordinate={{ latitude, longitude }} 
              draggable
              onDragEnd={handleMapPress}
              title="Delivery Location"
              pinColor={COLORS.primary}
            />
          </MapView>
          
          <TouchableOpacity 
            style={styles.floatingLocBtn} 
            onPress={handleGetCurrentLocation}
            disabled={locating}
          >
            {locating 
              ? <ActivityIndicator color={COLORS.primary} size="small" />
              : <Text style={{fontSize: 20}}>🎯</Text>
            }
          </TouchableOpacity>
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

        {latitude && longitude && (
          <Text style={styles.coordText}>
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, saving && {opacity: 0.7}]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Address</Text>
          }
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
  mapContainer: { height: 250, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.surfaceContainerLow, borderWidth: 1, borderColor: COLORS.outlineVariant },
  map: { flex: 1 },
  floatingLocBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 4 },
  inputGroup: { gap: 16 },
  input: { backgroundColor: COLORS.surfaceContainerLowest, padding: 16, borderRadius: 16, fontSize: 16, color: COLORS.onSurface, borderWidth: 1, borderColor: COLORS.outlineVariant },
  coordText: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: COLORS.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainerHighest },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 32, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '800' }
});


