import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, Button } from 'react-native';
import api from '../../utils/api';

export default function MenusScreen() {
  const [menus, setMenus] = useState<any[]>([]);
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple form state for adding a menu item
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const messRes = await api.get('/messes/provider/my-messes');
      const myMesses = messRes.data;
      setMesses(myMesses);

      if (myMesses.length > 0) {
        // Fetch menus for the first mess
        const menuRes = await api.get(`/menus/mess/${myMesses[0].id}`);
        setMenus(menuRes.data);
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async () => {
    if (!newItemName || !newItemPrice) return;
    try {
      await api.post('/menus', {
        messId: messes[0].id,
        itemName: newItemName,
        price: parseFloat(newItemPrice)
      });
      setNewItemName('');
      setNewItemPrice('');
      fetchData(); // Refresh
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to add menu item');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Management</Text>
      
      {messes.length > 0 && (
        <View style={styles.addForm}>
          <Text style={styles.subtitle}>Add Item</Text>
          <TextInput style={styles.input} placeholder="Item Name" value={newItemName} onChangeText={setNewItemName} />
          <TextInput style={styles.input} placeholder="Price" value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="numeric" />
          <Button title="Add Menu Item" onPress={addMenuItem} />
        </View>
      )}

      <FlatList
        data={menus}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text>₹{item.price}</Text>
            <Text>Available: {item.isAvailable ? 'Yes' : 'No'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No menu items found. Add some above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  addForm: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, elevation: 1 },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 4 },
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, elevation: 2 },
  itemName: { fontSize: 18, fontWeight: 'bold' }
});
