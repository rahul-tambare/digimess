import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface MapProps {
  position: { lat: number; lng: number };
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}

// Lazy-loaded leaflet components (only loaded in browser, not during SSR)
let MapContainer: any = null;
let TileLayer: any = null;
let useMapEvents: any = null;

function WebMapEvents({ onPositionChange }: { onPositionChange: (pos: { lat: number; lng: number }) => void }) {
  if (!useMapEvents) return null;
  useMapEvents({
    dragend: (e: any) => {
      const target = e.target;
      const center = target.getCenter();
      onPositionChange({ lat: center.lat, lng: center.lng });
    },
  });
  return null;
}

export default function LocationPickerMap({ position, onPositionChange }: MapProps) {
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    // Only import leaflet in the browser (window must exist)
    if (typeof window !== 'undefined') {
      const RL = require('react-leaflet');
      MapContainer = RL.MapContainer;
      TileLayer = RL.TileLayer;
      useMapEvents = RL.useMapEvents;
      setLeafletReady(true);
    }
  }, []);

  if (!leafletReady || !MapContainer) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#94A3B8' }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* @ts-ignore */}
      <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        {/* @ts-ignore */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
        <WebMapEvents onPositionChange={onPositionChange} />
      </MapContainer>
      <View style={styles.centerMarker}>
        <MapPin size={36} color="#FF6B35" fill="#FFF" style={{ marginTop: -18 }} />
      </View>
    </div>
  );
}

const styles = StyleSheet.create({
  centerMarker: { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -36, zIndex: 1000 },
});
