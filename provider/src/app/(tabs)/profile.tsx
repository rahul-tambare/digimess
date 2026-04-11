import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { removeToken } from '../../utils/api';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Provider Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.subtitle}>Settings</Text>
        <Text>Manage bank details, address, and more features can be integrated here.</Text>
      </View>

      <Button title="Log Out" color="#FF3B30" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 20, elevation: 2 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
});
