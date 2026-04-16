import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
import { useUserStore } from '@/stores/dataStore';
import { userApi } from '@/services/api';

export default function LocationScreen() {
  const router = useRouter();
  const updateUser = useUserStore(state => state.updateUser);

  const handleAllowLocation = async () => {
    const loc = { lat: 18.5204, lng: 73.8567, area: "Shivaji Nagar, Pune" };
    try {
      await userApi.updateProfile({ locationLat: loc.lat, locationLng: loc.lng, locationArea: loc.area });
    } catch (err) {
      console.log('Location API save failed, saving locally:', err);
    }
    updateUser({ location: loc });
    router.replace('/(tabs)');
  };

  const handleEnterManually = async () => {
    const loc = { lat: 18.5204, lng: 73.8567, area: "Shivaji Nagar, Pune" };
    try {
      await userApi.updateProfile({ locationLat: loc.lat, locationLng: loc.lng, locationArea: loc.area });
    } catch (err) {
      console.log('Location API save failed, saving locally:', err);
    }
    updateUser({ location: loc });
    router.replace('/(tabs)');
  };

  return (
    <View style={s.container}>
      <View style={s.iconCircle}>
        <MapPin size={64} color="#FF6B35" />
      </View>

      <Text style={s.title}>What's your location?</Text>
      <Text style={s.subtitle}>We need your location to show available messes and reliable delivery times around you.</Text>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={s.primaryBtn} onPress={handleAllowLocation} activeOpacity={0.8}>
        <Navigation size={20} color="#FFF" />
        <Text style={s.primaryBtnText}>Allow Location Access</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.secondaryBtn} onPress={handleEnterManually} activeOpacity={0.7}>
        <Text style={s.secondaryBtnText}>Enter Location Manually</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,107,53,0.06)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 28,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 10, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500', textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 14, gap: 10, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(255,107,53,0.25)' },
    }),
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF',
  },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 },
});
