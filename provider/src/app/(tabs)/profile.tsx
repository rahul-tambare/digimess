// ==========================================
// Profile & Settings Screen — Live API Data
// ==========================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import { providerApi, messApi, vendorApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { getInitials, formatCurrency } from '../../lib/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mess, setMess] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const [messes, bank] = await Promise.all([
            messApi.getMyMesses(),
            vendorApi.getBankDetails(),
          ]);
          if (messes && messes.length > 0) setMess(messes[0]);
          if (bank) setBankDetails(bank);
        } catch (e) {
          console.error('Profile fetch error:', e);
        }
      };
      fetchProfile();
    }, [])
  );

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const handleToggleVacation = async () => {
    try {
      const res = await providerApi.toggleMess();
      if (mess) setMess({ ...mess, isOpen: res.isOpen });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const menuSections = [
    {
      title: 'Business',
      items: [
        { icon: '💰', label: 'Earnings & Analytics', onPress: () => router.push('/earnings') },
        { icon: '🏦', label: 'Banking Details', subtitle: bankDetails ? `A/C ****${bankDetails.accountNumber?.slice(-4)}` : 'Not set', onPress: () => Alert.alert('Coming Soon', 'Bank editing coming in next update') },
        { icon: '📊', label: 'Business Stats', subtitle: mess ? `${mess.rating || 0}★ rating` : 'N/A', onPress: () => {} },
      ],
    },
    {
      title: 'Mess Settings',
      items: [
        { icon: '🏪', label: 'Edit Mess Details', subtitle: mess?.name || 'N/A', onPress: () => {} },
        { icon: '⏰', label: 'Operating Hours', subtitle: `${mess?.lunchStartTime || '12:00'} - ${mess?.dinnerEndTime || '22:00'}`, onPress: () => {} },
        { icon: '🌍', label: 'Delivery Settings', subtitle: `${mess?.deliveryAvailable ? 'Active' : 'Inactive'} • ${mess?.deliveryRadius || 5}km radius`, onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help & Support', onPress: () => Alert.alert('Support', 'Email: support@digimess.com\nPhone: 1800-XXX-XXXX') },
        { icon: '📜', label: 'Terms & Conditions', onPress: () => {} },
        { icon: '🔒', label: 'Privacy Policy', onPress: () => {} },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name || 'P')}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.vendorName}>{user?.name || 'Provider'}</Text>
          <Text style={styles.vendorPhone}>{user?.phone}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>⭐ {mess?.rating || 0}</Text>
          </View>
        </View>
        <Pressable style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
      </View>

      {/* Vacation Mode (reversed: isOpen = not on vacation) */}
      <View style={styles.vacation}>
        <ToggleSwitch
          label="🏖️ Vacation Mode"
          description="Pause all incoming orders"
          value={!mess?.isOpen}
          onValueChange={handleToggleVacation}
        />
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <ToggleSwitch label="New Order Alerts" value={orderAlerts} onValueChange={setOrderAlerts} />
          <ToggleSwitch label="Payment Received" value={paymentAlerts} onValueChange={setPaymentAlerts} />
          <ToggleSwitch label="Customer Reviews" value={reviewAlerts} onValueChange={setReviewAlerts} />
        </View>
      </View>

      {/* Menu Sections */}
      {menuSections.map((section, sIdx) => (
        <View key={sIdx} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, iIdx) => (
              <Pressable key={iIdx} style={[styles.menuRow, iIdx < section.items.length - 1 && styles.menuRowBorder]} onPress={item.onPress}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={() => setShowLogout(true)}>
        <Text style={styles.logoutText}>🚪 Log Out</Text>
      </Pressable>

      <Text style={styles.version}>DigiMess Provider v1.0.0</Text>
      <View style={{ height: 40 }} />

      <ConfirmModal
        visible={showLogout}
        title="Log Out"
        message="Are you sure you want to log out?"
        variant="danger"
        confirmLabel="Log Out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  pageTitle: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, margin: Spacing.xl,
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
  avatarText: { color: Colors.textInverse, fontSize: FontSizes.xxl, fontWeight: FontWeights.bold },
  profileInfo: { flex: 1 },
  vendorName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  vendorPhone: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  ratingText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.warning },
  editBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryBg },
  editBtnText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  vacation: {
    marginHorizontal: Spacing.xl, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.xl,
    ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.lg,
  },
  section: { marginBottom: Spacing.lg, paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.xl, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  menuSubtitle: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textTertiary },
  logoutBtn: {
    marginHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl, backgroundColor: Colors.surface,
    alignItems: 'center', ...Shadows.sm,
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.error },
  version: { textAlign: 'center', color: Colors.textTertiary, fontSize: FontSizes.xs, marginTop: Spacing.xl },
});
