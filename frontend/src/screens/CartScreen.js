import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../utils/CartContext';
import api from '../utils/api';
import Header from '../components/Header';

const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
};

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cartItems, removeFromCart, totalItems, clearCart } = useCart();
  const [loading, setLoading] = React.useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    try {
      setLoading(true);
      const response = await api.post('/orders', {
        messId: 'default-mess-id', // In a real app, this should come from the items
        totalAmount: totalPrice,
        orderType: 'on_demand',
        items: cartItems
      });
      
      clearCart();
      navigation.replace('OrderSuccess', { orderId: response.data.orderId });
    } catch (err) {
      console.error('Checkout failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to place order. Please try again.';
      if (errMsg === 'Insufficient wallet balance') {
        const shortfall = err.response?.data?.shortfall;
        Alert.alert(
          'Insufficient Balance', 
          'Your wallet balance is too low to place this order. Please top up your wallet.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Top Up', onPress: () => navigation.navigate('WalletTopUp', { amount: shortfall ? Math.ceil(shortfall) : '' }) }
          ]
        );
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack={true} noTopInset={false} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your Tray</Text>
        <Text style={styles.subtitle}>Review your selected meals before ordering.</Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{fontSize: 64, marginBottom: 20}}>🥘</Text>
            <Text style={styles.emptyTitle}>Empty Tray</Text>
            <Text style={styles.emptySubtitle}>You haven't added any meals yet. Start exploring local kitchens!</Text>
            <TouchableOpacity 
              style={styles.exploreBtn} 
              onPress={() => navigation.navigate('Mess')}
            >
              <Text style={styles.exploreBtnText}>Explore Messes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cartList}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price} x {item.quantity || 1}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutBtn} 
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutText}>Place Order →</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface },
  subtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, marginBottom: 32 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, marginBottom: 32 },
  exploreBtn: { backgroundColor: COLORS.primaryContainer, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 99 },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cartList: { gap: 16 },
  cartCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: {height: 4, width: 0}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  itemPrice: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  removeBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ff3b30' },
  removeText: { color: '#ff3b30', fontSize: 12, fontWeight: '700' },
  footer: { backgroundColor: COLORS.surfaceContainerLowest, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: {height: -4, width: 0}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant },
  totalPrice: { fontSize: 28, fontWeight: '900', color: COLORS.onSurface },
  checkoutBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
