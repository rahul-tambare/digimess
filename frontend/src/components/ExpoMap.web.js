import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = ({ children, style }) => (
  <View style={[style, styles.webMap]}>
    <Text style={styles.text}>📍 Map Preview (Mobile Only)</Text>
    <Text style={styles.subText}>Please use the mobile app for GPS picking.</Text>
    {children}
  </View>
);

export const Marker = () => null;

const styles = StyleSheet.create({
  webMap: {
    backgroundColor: '#f4f3f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0c0b2',
    borderRadius: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a14000',
  },
  subText: {
    fontSize: 12,
    color: '#584238',
    marginTop: 4,
  }
});

export default MapView;
