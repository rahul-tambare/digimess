import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, CheckCircle2, XCircle, RotateCcw, Star, ChevronRight } from 'lucide-react-native';
import { useOrderStore } from '@/stores/dataStore';

export default function OrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const orders = useOrderStore(state => state.orders);
  const loading = useOrderStore(state => state.loading);
  const fetchOrders = useOrderStore(state => state.fetchOrders);

  const tabs = ['All', 'Subscriptions', 'Delivered', 'Cancelled'];

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'preparing': return { color: '#F59E0B', bg: '#FFFBEB', icon: <Clock size={14} color="#F59E0B" />, text: 'Preparing' };
      case 'delivered': return { color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle2 size={14} color="#10B981" />, text: 'Delivered' };
      case 'active_sub': return { color: '#8B5CF6', bg: '#F5F3FF', icon: <Clock size={14} color="#8B5CF6" />, text: 'Active' };
      case 'cancelled': return { color: '#EF4444', bg: '#FEF2F2', icon: <XCircle size={14} color="#EF4444" />, text: 'Cancelled' };
      default: return { color: '#94A3B8', bg: '#F8FAFC', icon: null, text: status };
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders & Subscriptions</Text>
        </View>
      </SafeAreaView>

      {/* Tab pills */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ color: '#94A3B8', marginTop: 12, fontWeight: '600' }}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 16 }}>No orders yet</Text>
            <Text style={{ color: '#94A3B8', marginTop: 6, fontWeight: '500', textAlign: 'center' }}>Your orders will appear here once you place your first order</Text>
          </View>
        ) : orders
          .filter((o: any) => {
            const status = o.status || '';
            if (activeTab === 'All') return true;
            if (activeTab === 'Subscriptions') return status === 'active_sub';
            if (activeTab === 'Delivered') return status === 'delivered';
            if (activeTab === 'Cancelled') return status === 'cancelled';
            return true;
          })
          .map((order: any) => {
            const config = getStatusConfig(order.status || 'pending');
            const messName = order.messName || order.mess_name || 'Mess';
            const items = order.items ? (typeof order.items === 'string' ? order.items : `${order.items.length} item(s)`) : '';
            const total = order.totalAmount || order.total || 0;
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => { if (order.status === 'preparing') router.push(`/order/${order.id}`); }}
                activeOpacity={0.8}
              >
                {/* Top */}
                <View style={styles.orderTop}>
                  <View style={styles.orderAvatar}>
                    <Text style={styles.orderAvatarText}>{messName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.orderMessName}>{messName}</Text>
                    <Text style={styles.orderDate}>{date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderAmount}>₹{total}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      {config.icon}
                      <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.orderItemsRow}>
                  <Text style={styles.orderItems}>{items}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {order.status === 'delivered' && (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/rating')}>
                        <Star size={14} color="#FF6B35" />
                        <Text style={styles.actionBtnText}>Rate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                        <RotateCcw size={14} color="#FFF" />
                        <Text style={styles.actionBtnTextPrimary}>Reorder</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary, { flex: 1 }]} onPress={() => router.push(`/order/${order.id}`)}>
                      <Text style={styles.actionBtnTextPrimary}>Track Order →</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'active_sub' && (
                    <TouchableOpacity style={[styles.actionBtn, { flex: 1, borderColor: '#8B5CF6' }]}>
                      <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Manage Subscription</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  tabBar: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFF' },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderAvatarText: { fontSize: 14, fontWeight: '800', color: '#FF6B35' },
  orderMessName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  orderDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  orderAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderItemsRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginBottom: 12,
  },
  orderItems: { fontSize: 13, color: '#475569', fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  actionBtnPrimary: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  actionBtnTextPrimary: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});
