import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Tag, Package, Info } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'notification_prefs';

interface NotifPrefs {
  orderUpdates: boolean;
  offers: boolean;
  newMesses: boolean;
}

const DEFAULT_PREFS: NotifPrefs = { orderUpdates: true, offers: true, newMesses: true };

const loadPrefs = async (): Promise<NotifPrefs> => {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      raw = localStorage.getItem(STORAGE_KEY);
    } else {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    }
    return raw ? JSON.parse(raw) : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
};

const savePrefs = async (prefs: NotifPrefs) => {
  try {
    const json = JSON.stringify(prefs);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, json);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, json);
    }
  } catch {}
};

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      savePrefs(updated);
      return updated;
    });
  };

  const ToggleRow = ({ icon, title, subtitle, value, onToggle }: any) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E2E8F0', true: '#FFB699' }}
        thumbColor={value ? '#FF6B35' : '#CBD5E1'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <ToggleRow
            icon={<Package size={20} color="#475569" />}
            title="Order Updates"
            subtitle="Status changes, delivery alerts"
            value={prefs.orderUpdates}
            onToggle={() => toggle('orderUpdates')}
          />
          <ToggleRow
            icon={<Tag size={20} color="#475569" />}
            title="Offers & Discounts"
            subtitle="Deals, coupons, seasonal offers"
            value={prefs.offers}
            onToggle={() => toggle('offers')}
          />
          <ToggleRow
            icon={<Bell size={20} color="#475569" />}
            title="New Messes Nearby"
            subtitle="When new messes open in your area"
            value={prefs.newMesses}
            onToggle={() => toggle('newMesses')}
          />
        </View>

        <View style={styles.noteSection}>
          <Info size={16} color="#94A3B8" />
          <Text style={styles.noteText}>Push notifications require system permissions. If you're not receiving notifications, check your device settings.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  section: { backgroundColor: '#FFF', marginTop: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  rowSubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  noteSection: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 20, marginTop: 20, padding: 14, borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  noteText: { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '500', lineHeight: 19 },
});
