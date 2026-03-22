import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';



const COLORS = {
  primary: '#a14000',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerHighest: '#e3e2e1',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  primaryFixed: '#ffdbcc',
  tertiaryContainer: '#c58a00',
  tertiaryFixed: '#ffdeac'
};

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState('0.00');
  const [config, setConfig] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [balRes, txRes, configRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/wallet/transactions'),
          api.get('/config')
        ]);
        setBalance(Number(balRes.data.walletBalance).toFixed(2));
        setTransactions(txRes.data);
        setConfig(configRes.data);
      } catch (err) {
        console.log('Error fetching wallet:', err);
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
      <Header navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingBottom: 100}}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Balance</Text>
          <Text style={styles.pageSubtitle}>Manage your culinary credits and track your seasonal dining history.</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroContentRow}>
            <View>
              <Text style={styles.heroLabel}>AVAILABLE CREDITS</Text>
              <Text style={styles.heroBalance}>{config.currencySymbol || '₹'}{balance}</Text>
            </View>
            <View style={styles.heroIconBox}><Text style={{fontSize: 24}}>💳</Text></View>
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>Premium Mess Member • Active</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, {backgroundColor: COLORS.secondaryContainer}]}>
            <View style={styles.statIconRow}>
              <View style={[styles.statIconWrap, {backgroundColor: COLORS.secondary}]}><Text>📈</Text></View>
              <Text style={[styles.statLabel, {color: '#005312'}]}>THIS MONTH</Text>
            </View>
            <Text style={[styles.statValue, {color: '#005312'}]}>{config.currencySymbol || '₹'}2,450</Text>
            <Text style={[styles.statDesc, {color: 'rgba(0,83,18,0.7)'}]}>Total spent on meals</Text>
          </View>

          <View style={[styles.statBox, {backgroundColor: COLORS.surfaceContainerLow}]}>
            <View style={styles.statIconRow}>
              <View style={[styles.statIconWrap, {backgroundColor: COLORS.tertiaryContainer}]}><Text>💰</Text></View>
              <Text style={[styles.statLabel, {color: '#c58a00'}]}>TOTAL SAVINGS</Text>
            </View>
            <Text style={[styles.statValue, {color: '#c58a00'}]}>{config.currencySymbol || '₹'}420</Text>
            <Text style={[styles.statDesc, {color: 'rgba(197,138,0,0.7)'}]}>Via early-bird topups</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('WalletTopUp')}>
            <View style={[styles.actionIconWrap, {backgroundColor: COLORS.primaryFixed}]}><Text>➕</Text></View>
            <Text style={styles.actionBtnText}>Top Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconWrap, {backgroundColor: COLORS.secondaryContainer}]}><Text>💸</Text></View>
            <Text style={styles.actionBtnText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TransactionHistory')}>
            <View style={[styles.actionIconWrap, {backgroundColor: COLORS.tertiaryFixed}]}><Text>📊</Text></View>
            <Text style={styles.actionBtnText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}><Text style={styles.recentViewAll}>View All</Text></TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 20}} />
          ) : (
            <View style={styles.recentList}>
              {transactions.length === 0 ? (
                <Text style={{color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 20}}>No recent activity.</Text>
              ) : (
                transactions.slice(0, 3).map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <View key={tx.id} style={styles.txCard}>
                      <View style={[styles.txIconWrap, isCredit ? {backgroundColor: COLORS.primaryFixed} : undefined]}>
                        <Text>{isCredit ? '🏦' : '🍽️'}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txTitle}>{tx.description || 'Transaction'}</Text>
                        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString()}</Text>
                      </View>
                      <View style={styles.txAmountWrap}>
                        <Text style={isCredit ? styles.txPlus : styles.txMinus}>{isCredit ? '+' : '-'} {config.currencySymbol || '₹'}{Number(tx.amount).toFixed(2)}</Text>
                        <Text style={styles.txStatus}>SUCCESS</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  titleSection: { marginBottom: 24 },
  pageTitle: { fontSize: 36, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22 },
  heroCard: { backgroundColor: COLORS.primary, borderRadius: 32, padding: 32, marginBottom: 24 },
  heroContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 8 },
  heroBalance: { fontSize: 48, fontWeight: '900', color: '#fff' },
  heroIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 16 },
  heroFooterText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statBox: { flex: 1, borderRadius: 24, padding: 20, justifyContent: 'center' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statDesc: { fontSize: 11 },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  actionBtn: { flex: 1, backgroundColor: COLORS.surfaceContainerLowest, paddingVertical: 24, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.onSurface },
  recentSection: { flex: 1 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  recentTitle: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  recentViewAll: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  recentList: { gap: 12 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 20, borderRadius: 24 },
  txIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  txTitle: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  txDate: { fontSize: 12, color: COLORS.onSurfaceVariant },
  txAmountWrap: { alignItems: 'flex-end', justifyContent: 'center' },
  txMinus: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  txPlus: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  txStatus: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, marginTop: 4 }
});
