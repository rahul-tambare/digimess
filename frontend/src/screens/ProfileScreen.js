import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';



const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  tertiaryFixed: '#ffdeac',
  primaryFixed: '#ffdbcc',
  surfaceContainerHighest: '#e3e2e1',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a'
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        setProfile(res.data);
      } catch (err) {
        console.log('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = navigation.addListener('focus', fetchProfile);
    fetchProfile();
    return unsubscribe;
  }, [navigation]);

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingBottom: 100}}>
        {/* Profile Info */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 40}} />
        ) : profile ? (
          <View style={styles.profileSection}>
            <View style={styles.profileImgWrap}>
              <Image source={{uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxCfVEJXIS5eqi3v32vYzK0MQCo5KpncesMkd3XWhhTE9JEAC7YFnlrFTtHerZlHR3ZeEiAhMf5Ht8dsn0xVEJdTyOHkd_n3rGCo9FE3m0T6vqRvnZku1gF-b9TgD6Btz2IWTHjCd2BIw1Qy_AyT061Aa0hsEBGVOWvAIIjv7dQCI0K7wO0v2gKQjBa5Jgx-W1AYIHZJGtWbtdF4h60uM8UdydKsi1QQ_jvXukXiFniy9cpL5zaiCjgBcyB--dUt-E9gyJOTxrtsY'}} style={styles.profileImg} />
              {profile.role !== 'customer' && <View style={styles.proBadge}><Text style={styles.proText}>{profile.role.toUpperCase()}</Text></View>}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{profile.name || 'Digimess User'}</Text>
              <Text style={styles.email}>{profile.email || profile.phone}</Text>
            </View>
          </View>
        ) : (
          <Text style={{textAlign: 'center', color: COLORS.onSurfaceVariant, marginTop: 40}}>Cannot load profile.</Text>
        )}

        {/* Wallet Quick View */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeaderRow}>
            <View>
              <Text style={styles.walletLabel}>WALLET BALANCE</Text>
              <Text style={styles.walletBalance}>₹{profile ? Number(profile.walletBalance).toFixed(2) : '0.00'}</Text>
            </View>
            <Text style={{fontSize: 28}}>💳</Text>
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.addMoneyBtn} onPress={() => navigation.navigate('WalletTopUp')}>
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.forwardBtn} onPress={() => navigation.navigate('Wallet')}>
              <Text style={{color: '#fff', fontSize: 20}}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings List */}
        <Text style={styles.settingsTitle}>Account Settings</Text>
        <View style={styles.settingsList}>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('MySubscriptions')}>
            <View style={[styles.settingIconWrap, {backgroundColor: COLORS.secondaryContainer}]}>
              <Text style={{fontSize: 20}}>📺</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.settingLabel}>My Subscriptions</Text>
              <Text style={styles.settingDesc}>Manage your recurring meal plans</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('TransactionHistory')}>
            <View style={[styles.settingIconWrap, {backgroundColor: COLORS.tertiaryFixed}]}>
              <Text style={{fontSize: 20}}>🕒</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.settingLabel}>Transaction History</Text>
              <Text style={styles.settingDesc}>View all past orders and payments</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('SelectAddress')}>
            <View style={[styles.settingIconWrap, {backgroundColor: COLORS.primaryFixed}]}>
              <Text style={{fontSize: 20}}>📍</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.settingLabel}>Delivery Address</Text>
              <Text style={styles.settingDesc}>Save and edit your meal drop points</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIconWrap, {backgroundColor: COLORS.surfaceContainerHighest}]}>
              <Text style={{fontSize: 20}}>🎧</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingDesc}>FAQs and live customer support</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32 },
  profileImgWrap: { position: 'relative' },
  profileImg: { width: 100, height: 100, borderRadius: 32, transform: [{rotate: '3deg'}] },
  proBadge: { position: 'absolute', bottom: -8, right: -8, backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  proText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  email: { fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  walletCard: { backgroundColor: COLORS.primaryContainer, borderRadius: 32, padding: 32, marginBottom: 32, elevation: 8, shadowColor: COLORS.primaryContainer, shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.3, shadowRadius: 20 },
  walletHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  walletLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5, marginBottom: 8 },
  walletBalance: { fontSize: 40, fontWeight: '900', color: '#fff' },
  walletActions: { flexDirection: 'row', gap: 12 },
  addMoneyBtn: { flex: 1, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  addMoneyText: { color: COLORS.primaryContainer, fontWeight: '800', fontSize: 14 },
  forwardBtn: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  settingsTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurfaceVariant, paddingHorizontal: 8, marginBottom: 16 },
  settingsList: { gap: 12, marginBottom: 32 },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 20, borderRadius: 24, gap: 16 },
  settingIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  settingDesc: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  chevron: { fontSize: 24, color: COLORS.outline },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.errorContainer, paddingVertical: 20, borderRadius: 24, marginTop: 16 },
  signOutIcon: { fontSize: 20 },
  signOutText: { color: COLORS.onErrorContainer, fontSize: 16, fontWeight: '800' }
});
