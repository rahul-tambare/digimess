import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, Heart, Bell, HelpCircle, LogOut, FileText, ChevronRight, Settings, CreditCard, Wallet, CalendarCheck } from 'lucide-react-native';
import { useUserStore } from '@/stores/dataStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const user = useUserStore(state => state.user);
  const logout = useUserStore(state => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const OptionRow = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.optionIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0) : 'U'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Section 1 */}
        <View style={styles.section}>
          <OptionRow icon={<MapPin size={20} color="#475569" />} title="Manage Addresses" subtitle="Home, Work & Others" />
          <OptionRow icon={<Heart size={20} color="#475569" />} title="Favourite Messes" subtitle="Sunita's Home Kitchen & more" />
          <OptionRow icon={<FileText size={20} color="#475569" />} title="Dietary Preferences" subtitle={`Current: ${user?.dietaryPreference || 'Veg'}`} />
          <OptionRow icon={<Wallet size={20} color="#475569" />} title="My Wallet" subtitle="₹4,250 available" onPress={() => router.push('/wallet')} />
          <OptionRow icon={<CreditCard size={20} color="#475569" />} title="Payment Methods" subtitle="Saved cards & UPI" />
          <OptionRow icon={<CalendarCheck size={20} color="#475569" />} title="My Subscriptions" subtitle="Active meal plans" onPress={() => router.push('/subscriptions')} />
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <OptionRow icon={<Bell size={20} color="#475569" />} title="Notifications" subtitle="Offers, Order Updates" />
          <OptionRow icon={<HelpCircle size={20} color="#475569" />} title="Help & Support" subtitle="FAQ, Contact Digi Mess" onPress={() => router.push('/faq')} />
          <OptionRow icon={<Settings size={20} color="#475569" />} title="App Settings" subtitle="Dark Mode, Language" />
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

        <Text style={styles.version}>MessWala Consumer App v1.0.0</Text>
      </ScrollView>
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
