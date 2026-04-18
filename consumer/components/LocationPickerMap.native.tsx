import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import MapView from 'react-native-maps';

interface MapProps {
  position: { lat: number; lng: number };
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}

export default function LocationPickerMap({ position, onPositionChange }: MapProps) {
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: position.lat,
          longitude: position.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={{
          latitude: position.lat,
          longitude: position.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onRegionChangeComplete={(region: any) => {
          if (Math.abs(region.latitude - position.lat) > 0.0001 || Math.abs(region.longitude - position.lng) > 0.0001) {
            onPositionChange({ lat: region.latitude, lng: region.longitude });
          }
        }}
      />
      <View style={styles.centerMarker}>
        <MapPin size={36} color="#FF6B35" fill="#FFF" style={{ marginTop: -18 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerMarker: { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -36, zIndex: 1000 },
});
