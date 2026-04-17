import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet as WalletIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '@/stores/dataStore';

export default function WalletScreen() {
  const router = useRouter();
  
  const balance = useWalletStore(state => state.balance);
  const transactions = useWalletStore(state => state.transactions);
  const loading = useWalletStore(state => state.loading);
  const fetchBalance = useWalletStore(state => state.fetchBalance);
  const fetchTransactions = useWalletStore(state => state.fetchTransactions);

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1);
  }, []);

  const totalSpent = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
  const totalTopup = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);

  if (loading) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Balance Hero */}
        <View style={s.balanceCard}>
          <View style={s.balanceTop}>
            <Text style={s.balanceLabel}>AVAILABLE BALANCE</Text>
            <WalletIcon size={24} color="rgba(255,255,255,0.4)" />
          </View>
          <Text style={s.balanceAmount}>₹{balance.toLocaleString()}</Text>
          <TouchableOpacity style={s.topUpBtn} onPress={() => router.push('/wallet-topup' as any)}>
            <Plus size={16} color="#FF6B35" />
            <Text style={s.topUpText}>Top Up</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <ArrowUpRight size={18} color="#EF4444" />
            <Text style={s.statLabel}>Total Spent</Text>
            <Text style={s.statValue}>₹{totalSpent.toLocaleString()}</Text>
          </View>
          <View style={s.statCard}>
            <ArrowDownLeft size={18} color="#10B981" />
            <Text style={s.statLabel}>Total Added</Text>
            <Text style={s.statValue}>₹{totalTopup.toLocaleString()}</Text>
          </View>
          <View style={s.statCard}>
            <TrendingUp size={18} color="#6366F1" />
            <Text style={s.statLabel}>Savings</Text>
            <Text style={s.statValue}>₹380</Text>
          </View>
        </View>

        {/* Transactions */}
        <Text style={s.sectionTitle}>Recent Transactions</Text>
        <View style={s.txnCard}>
          {transactions.map((txn, idx) => (
            <View key={txn.id} style={[s.txnRow, idx !== transactions.length - 1 && s.txnBorder]}>
              <View style={[s.txnIcon, { backgroundColor: txn.type === 'credit' ? '#ECFDF5' : '#FEF2F2' }]}>
                {txn.type === 'credit' ? <ArrowDownLeft size={16} color="#10B981" /> : <ArrowUpRight size={16} color="#EF4444" />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.txnDesc}>{txn.description}</Text>
                <Text style={s.txnDate}>{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <Text style={[s.txnAmount, { color: txn.type === 'credit' ? '#10B981' : '#EF4444' }]}>
                {txn.type === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  balanceCard: {
    backgroundColor: '#0F172A', borderRadius: 24, padding: 24, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 12 },
      default: { boxShadow: '0 12px 30px rgba(15,23,42,0.3)' },
    }),
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  balanceAmount: { fontSize: 40, fontWeight: '800', color: '#FFF', marginBottom: 20, letterSpacing: -1 },
  topUpBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 6,
  },
  topUpText: { fontSize: 14, fontWeight: '800', color: '#FF6B35' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 14, letterSpacing: -0.3 },
  txnCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  txnBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  txnIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  txnDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800' },
});
