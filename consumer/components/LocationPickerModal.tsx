import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, X, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import LocationPickerMap from './LocationPickerMap';

interface LocationData {
  lat: number;
  lng: number;
  area: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const DEFAULT_CENTER = { lat: 18.4410, lng: 73.8115 }; // Dhayari, Pune default

export function LocationPickerModal({ visible, onClose, onSelect, initialLocation }: Props) {
  const [position, setPosition] = useState<{lat: number, lng: number}>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : DEFAULT_CENTER
  );
  const [address, setAddress] = useState(initialLocation?.area || 'Drag map to select location');
  const [loading, setLoading] = useState(false);

  // Get current GPS location
  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const newPos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setPosition(newPos);
      await reverseGeocode(newPos.lat, newPos.lng);
    } catch (e) {
      console.error(e);
      alert('Could not fetch GPS location.');
    } finally {
      setLoading(false);
    }
  };

  // Reverse Geocode
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (res && res.length > 0) {
        const place = res[0];
        const areaName = [place.subregion, place.city, place.region].filter(Boolean).join(', ');
        setAddress(areaName || 'Unknown Area');
      } else {
        // Fallback to nominatim if expo location fails on web
        const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await osmRes.json();
        if (data && data.address) {
          const area = data.address.suburb || data.address.city || data.address.county || 'Selected Location';
          setAddress(area);
        } else {
          setAddress('Selected Location');
        }
      }
    } catch (e) {
      console.warn('Reverse geocode failed', e);
      setAddress('Selected Location');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (newPos: { lat: number; lng: number }) => {
    setPosition(newPos);
    reverseGeocode(newPos.lat, newPos.lng);
  };

  const handleConfirm = () => {
    onSelect({ lat: position.lat, lng: position.lng, area: address });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Area */}
        <View style={styles.mapContainer}>
          <LocationPickerMap position={position} onPositionChange={handlePositionChange} />
        </View>

        {/* Controls */}
        <View style={styles.bottomSheet}>
          <TouchableOpacity style={styles.gpsBtn} onPress={handleGetCurrentLocation} disabled={loading}>
            {loading ? <ActivityIndicator color="#FF6B35" size="small" /> : <Navigation size={20} color="#FF6B35" />}
            <Text style={styles.gpsBtnText}>Use current location</Text>
          </TouchableOpacity>

          <View style={styles.addressBox}>
            <MapPin size={20} color="#475569" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.addressTitle}>Confirm Delivery Area</Text>
              <Text style={styles.addressText}>{address}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 8, marginLeft: -8 },
  mapContainer: { flex: 1, backgroundColor: '#E2E8F0', position: 'relative' },
  bottomSheet: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10, marginTop: -20 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5', marginBottom: 20 },
  gpsBtnText: { fontSize: 15, fontWeight: '700', color: '#FF6B35', marginLeft: 8 },
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 20 },
  addressTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginBottom: 4 },
  addressText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  confirmBtn: { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
