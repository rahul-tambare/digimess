import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, Heart, Bell, HelpCircle, LogOut, FileText, ChevronRight, Settings, CreditCard, Wallet, CalendarCheck } from 'lucide-react-native';
import { useUserStore } from '@/stores/dataStore';
import { useWalletStore, useDataStore } from '@/stores/dataStore';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

// ─── Typed OptionRow ────────────────────────────
interface OptionRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

const OptionRow = React.memo(({ icon, title, subtitle, onPress }: OptionRowProps) => (
  <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
    <View style={styles.optionIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.optionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
    </View>
    <ChevronRight size={18} color="#CBD5E1" />
  </TouchableOpacity>
));

export default function ProfileScreen() {
  const user = useUserStore(state => state.user);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const fetchProfile = useUserStore(state => state.fetchProfile);
  const logout = useUserStore(state => state.logout);
  const router = useRouter();

  const balance = useWalletStore(state => state.balance);
  const fetchBalance = useWalletStore(state => state.fetchBalance);
  const favorites = useDataStore(state => state.favorites);
  const fetchFavorites = useDataStore(state => state.fetchFavorites);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── Auth guard ──────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        router.replace('/onboarding/phone');
        return;
      }
      // Fetch fresh data on every focus
      setLoading(true);
      Promise.all([fetchProfile(), fetchBalance(), fetchFavorites()])
        .finally(() => setLoading(false));
    }, [isAuthenticated])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchBalance(), fetchFavorites()]);
    setRefreshing(false);
  }, [fetchProfile, fetchBalance, fetchFavorites]);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  // ─── Dynamic subtitles ──────────────────────
  const walletSubtitle = `₹${balance.toLocaleString('en-IN')} available`;
  const favCount = favorites.length;
  const favSubtitle = favCount > 0 ? `${favCount} saved` : 'None yet';
  const dietSubtitle = `Current: ${user?.dietaryPreference || 'Not set'}`;
  const appVersion = Constants.expoConfig?.version ?? '0.0.0';

  if (!isAuthenticated) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {loading && !refreshing ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" colors={['#FF6B35']} />}
        >
          {/* Section 1 — Account */}
          <View style={styles.section}>
            <OptionRow icon={<MapPin size={20} color="#475569" />} title="Manage Addresses" subtitle="Home, Work & Others" onPress={() => router.push('/manage-addresses')} />
            <OptionRow icon={<Heart size={20} color="#475569" />} title="Favourite Messes" subtitle={favSubtitle} onPress={() => router.push('/favourites')} />
            <OptionRow icon={<FileText size={20} color="#475569" />} title="Dietary Preferences" subtitle={dietSubtitle} onPress={() => router.push('/dietary-preferences')} />
            <OptionRow icon={<Wallet size={20} color="#475569" />} title="My Wallet" subtitle={walletSubtitle} onPress={() => router.push('/wallet')} />
            <OptionRow icon={<CreditCard size={20} color="#475569" />} title="Payment Methods" subtitle="Cards, UPI & more" onPress={() => router.push('/payment-methods')} />
            <OptionRow icon={<CalendarCheck size={20} color="#475569" />} title="My Subscriptions" subtitle="Active meal plans" onPress={() => router.push('/subscriptions')} />
          </View>

          {/* Section 2 — Support & Settings */}
          <View style={styles.section}>
            <OptionRow icon={<Bell size={20} color="#475569" />} title="Notifications" subtitle="Order & offer alerts" onPress={() => router.push('/notifications-settings')} />
            <OptionRow icon={<HelpCircle size={20} color="#475569" />} title="Help & Support" subtitle="FAQ, Contact DigiMess" onPress={() => router.push('/faq')} />
            <OptionRow icon={<Settings size={20} color="#475569" />} title="App Settings" subtitle="Preferences & info" onPress={() => router.push('/app-settings')} />
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
              <View style={[styles.optionIcon, { backgroundColor: '#FEF2F2' }]}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>DigiMess Consumer v{appVersion}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B35',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  userPhone: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  editBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  editBtnText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '700',
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: '#FFF',
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 24,
  },
});
