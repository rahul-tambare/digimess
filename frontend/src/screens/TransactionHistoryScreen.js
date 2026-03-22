import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';

const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e3e2e1',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  outline: '#8c7166',
  error: '#ba1a1a',
  primaryFixed: '#ffdbcc',
  tertiaryFixed: '#ffdeac'
};

const TX_DATA = [
  { id: 1, type: 'debit', title: 'Artisan Sourdough Meal', subtitle: 'Order #9821 • 12:45 PM', amount: '-₹24.00', status: 'SUCCESS', icon: '🍽️', color: COLORS.secondaryContainer },
  { id: 2, type: 'credit', title: 'Wallet Top-up', subtitle: 'Via UPI • 09:15 AM', amount: '+₹150.00', status: 'SUCCESS', icon: '💳', color: COLORS.primaryFixed },
  { id: 3, type: 'debit', title: 'Monthly Subscription', subtitle: 'Editorial Kitchen Pass • 11:30 PM', amount: '-₹89.99', status: 'SUCCESS', icon: '📅', color: COLORS.tertiaryFixed },
  { id: 4, type: 'debit', title: 'Dinner: Chef\'s Special', subtitle: 'Order #9744 • 07:45 PM', amount: '-₹42.50', status: 'PENDING', icon: '🧾', color: COLORS.surfaceContainerHighest, pending: true },
  { id: 5, type: 'debit', title: 'Truffle Risotto', subtitle: 'Order #9712 • 12:20 PM', amount: '-₹38.00', status: 'SUCCESS', icon: '🍽️', color: COLORS.secondaryContainer }
];

export default function TransactionHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [balRes, txRes, orderRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/wallet/transactions'),
          api.get('/orders')
        ]);
        setBalance(Number(balRes.data.walletBalance).toFixed(2));
        setTransactions(txRes.data);
        setActiveOrders(orderRes.data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').slice(0, 2));
      } catch (err) {
        console.log('Error fetching wallet activity:', err);
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = navigation.addListener('focus', fetchWalletData);
    fetchWalletData();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack={true} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingBottom: 100}}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL BALANCE</Text>
          <Text style={styles.summaryBalance}>₹{balance}</Text>
          <View style={styles.summaryActions}>
            <TouchableOpacity style={styles.actionBtnWhite} onPress={() => navigation.navigate('WalletTopUp')}>
              <Text>➕</Text><Text style={styles.actionBtnWhiteText}>Top-up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnGlass}>
              <Text>⬇️</Text><Text style={styles.actionBtnGlassText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <View style={{marginBottom: 40}}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            {activeOrders.map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderMess}>{order.messName}</Text>
                  <Text style={styles.orderStatus}>{order.status.toUpperCase()} • ₹{order.totalAmount}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.trackBtn}
                  onPress={() => navigation.navigate('TrackOrder', { orderId: order.id })}
                >
                  <Text style={styles.trackBtnText}>Track</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Activities</Text>
          <TouchableOpacity><Text style={styles.filterText}>⚙️ Filter</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
          <View style={styles.chipActive}><Text style={styles.chipTextActive}>All Time</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Credit</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Debit</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Subscriptions</Text></View>
        </ScrollView>

        {/* Transactions List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 40}} />
        ) : transactions.length === 0 ? (
          <Text style={{textAlign: 'center', color: COLORS.onSurfaceVariant, marginTop: 40}}>No transaction history available.</Text>
        ) : (
          <>
            <Text style={styles.dateHeader}>ALL TRANSACTIONS</Text>
            <View style={styles.txList}>
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={[styles.txIconWrap, isCredit ? {backgroundColor: COLORS.primaryFixed} : {backgroundColor: COLORS.secondaryContainer}]}>
                      <Text style={{fontSize: 20}}>{isCredit ? '💳' : '🍽️'}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{tx.description || 'Transaction'}</Text>
                      <Text style={styles.txSubtitle}>{new Date(tx.createdAt).toLocaleString()}</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={[styles.txAmount, {color: isCredit ? COLORS.secondary : COLORS.error}]}>
                        {isCredit ? '+' : '-'} ₹{Number(tx.amount).toFixed(2)}
                      </Text>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, {backgroundColor: COLORS.secondary}]} />
                        <Text style={[styles.statusText, {color: COLORS.secondary}]}>SUCCESS</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.loadMoreBtn}>
          <Text style={styles.loadMoreText}>Load older transactions</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  summaryCard: { backgroundColor: COLORS.primaryContainer, borderRadius: 40, padding: 32, marginBottom: 40 },
  summaryLabel: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5, marginBottom: 8 },
  summaryBalance: { fontSize: 48, fontWeight: '900', color: '#fff', marginBottom: 24 },
  summaryActions: { flexDirection: 'row', gap: 16 },
  actionBtnWhite: { flexDirection: 'row', itemsCenter: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, gap: 8 },
  actionBtnWhiteText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  actionBtnGlass: { flexDirection: 'row', itemsCenter: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, gap: 8 },
  actionBtnGlassText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  filterSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  filterText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  chipScroll: { marginBottom: 32, flexGrow: 0 },
  chipContainer: { gap: 12 },
  chipActive: { backgroundColor: COLORS.primaryContainer, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 99 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  chip: { backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 99 },
  chipText: { color: COLORS.onSurfaceVariant, fontWeight: '700' },
  dateHeader: { fontSize: 12, fontWeight: '800', color: COLORS.outline, letterSpacing: 1, marginBottom: 16, marginTop: 16 },
  txList: { gap: 16 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, padding: 16, borderRadius: 24 },
  txIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 16 },
  txTitle: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  txSubtitle: { fontSize: 12, color: COLORS.onSurfaceVariant },
  txAmount: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  statusRow: { flexDirection: 'row', itemsCenter: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: -2 },
  loadMoreBtn: { marginTop: 48, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 99, borderWidth: 2, borderColor: COLORS.surfaceContainerHighest },
  loadMoreText: { color: COLORS.onSurfaceVariant, fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, marginBottom: 16 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondaryContainer, padding: 20, borderRadius: 24, marginBottom: 12 },
  orderInfo: { flex: 1 },
  orderMess: { fontSize: 18, fontWeight: '800', color: '#005312' },
  orderStatus: { fontSize: 12, fontWeight: '600', color: '#106d20', marginTop: 4 },
  trackBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99 },
  trackBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 }
});
