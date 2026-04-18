// ==========================================
// Profile & Settings Screen — Live API Data + Edit Modals
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
  useWindowDimensions, Modal, TextInput, KeyboardAvoidingView,
  ActivityIndicator, Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import { providerApi, messApi, vendorApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { getInitials } from '../../lib/utils';

// ── Reusable inline modal ─────────────────────────────────────────────────────
interface EditModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => Promise<void>;
  children: React.ReactNode;
}

function EditModal({ visible, title, onClose, onSave, children }: EditModalProps) {
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={emStyles.overlay}>
        <View style={emStyles.sheet}>
          <View style={emStyles.header}>
            <Text style={emStyles.title}>{title}</Text>
            <Pressable onPress={onClose} style={emStyles.closeBtn}>
              <Text style={emStyles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <Pressable
            style={[emStyles.saveBtn, saving && emStyles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={emStyles.saveBtnText}>Save Changes</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const emStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  closeBtn: { padding: Spacing.sm },
  closeText: { fontSize: 18, color: Colors.textTertiary },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
});

// ── Field component ───────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}
function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }: FieldProps) {
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={fStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSizes.md, color: Colors.textPrimary, backgroundColor: Colors.background,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const isTablet = width >= 600;
  const hPad = isTablet ? Spacing.xxl : Spacing.xl;
  const avatarSize = isNarrow ? 52 : isTablet ? 80 : 64;
  const styles = makeStyles(width, isNarrow, isTablet, hPad, avatarSize);
  const router = useRouter();
  const { user, login, logout, token } = useAuthStore();

  const [mess, setMess] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);

  // Modal visibility
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditMess, setShowEditMess] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showBank, setShowBank] = useState(false);

  // Edit Profile fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Edit Mess fields
  const [editMessName, setEditMessName] = useState('');
  const [editMessDesc, setEditMessDesc] = useState('');

  // Operating Hours fields
  const [lunchStart, setLunchStart] = useState('');
  const [lunchEnd, setLunchEnd] = useState('');
  const [dinnerStart, setDinnerStart] = useState('');
  const [dinnerEnd, setDinnerEnd] = useState('');

  // Delivery Settings
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryRadius, setDeliveryRadius] = useState('5');

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');



  // ── Fetch on focus ────────────────────────────────────────────────────────
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

  // ── Open modals with pre-filled data ────────────────────────────────────
  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setShowEditProfile(true);
  };

  const openEditMess = () => {
    setEditMessName(mess?.name || '');
    setEditMessDesc(mess?.description || '');
    setShowEditMess(true);
  };

  const openHours = () => {
    setLunchStart(mess?.lunchStartTime || '');
    setLunchEnd(mess?.lunchEndTime || '');
    setDinnerStart(mess?.dinnerStartTime || '');
    setDinnerEnd(mess?.dinnerEndTime || '');
    setShowHours(true);
  };

  const openDelivery = () => {
    setDeliveryAvailable(!!mess?.deliveryAvailable);
    setDeliveryRadius(String(mess?.deliveryRadius || 5));
    setShowDelivery(true);
  };

  const openBank = () => {
    setBankName(bankDetails?.bankName || '');
    setAccountNumber(bankDetails?.accountNumber || '');
    setAccountHolderName(bankDetails?.accountHolderName || '');
    setIfscCode(bankDetails?.ifscCode || '');
    setUpiId(bankDetails?.upiId || '');
    setShowBank(true);
  };

  // ── Save handlers ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    const res = await providerApi.updateProfile({ name: editName.trim(), email: editEmail.trim() || undefined });
    // Keep auth store user in sync
    if (res?.user && token) {
      login(token, { ...user, ...res.user });
    }
  };

  const saveMessDetails = async () => {
    if (!mess?.id) throw new Error('No mess found');
    await messApi.updateSettings(mess.id, {
      name: editMessName.trim() || undefined,
      description: editMessDesc.trim() || undefined,
    });
    const [messes] = await Promise.all([messApi.getMyMesses()]);
    if (messes && messes.length > 0) setMess(messes[0]);
  };

  const saveHours = async () => {
    if (!mess?.id) throw new Error('No mess found');
    await messApi.updateSettings(mess.id, {
      lunchStartTime: lunchStart.trim() || null,
      lunchEndTime: lunchEnd.trim() || null,
      dinnerStartTime: dinnerStart.trim() || null,
      dinnerEndTime: dinnerEnd.trim() || null,
    });
    const messes = await messApi.getMyMesses();
    if (messes && messes.length > 0) setMess(messes[0]);
  };

  const saveDelivery = async () => {
    if (!mess?.id) throw new Error('No mess found');
    await messApi.updateSettings(mess.id, {
      deliveryAvailable,
      deliveryRadius: parseFloat(deliveryRadius) || 5,
    });
    const messes = await messApi.getMyMesses();
    if (messes && messes.length > 0) setMess(messes[0]);
  };

  const saveBank = async () => {
    if (!accountNumber.trim() || !accountHolderName.trim() || !ifscCode.trim()) {
      throw new Error('Account number, holder name, and IFSC code are required.');
    }
    const payload = {
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim() || undefined,
    };
    let updated: any;
    if (bankDetails) {
      updated = await vendorApi.updateBankDetails(payload);
    } else {
      updated = await vendorApi.createBankDetails(payload);
    }
    setBankDetails(updated?.bankDetails || { ...payload });
  };

  // ── Vacation toggle ──────────────────────────────────────────────────────
  const handleToggleVacation = async () => {
    try {
      const res = await providerApi.toggleMess();
      if (mess) setMess({ ...mess, isOpen: res.isOpen });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  // ── Menu sections ─────────────────────────────────────────────────────────
  const menuSections = [
    {
      title: 'Business',
      items: [
        { icon: '💰', label: 'Earnings & Analytics', onPress: () => router.push('/earnings') },
        {
          icon: '🏦', label: 'Banking Details',
          subtitle: bankDetails ? `A/C ****${bankDetails.accountNumber?.slice(-4)}` : 'Not set',
          onPress: openBank,
        },
        { icon: '📊', label: 'Business Stats', subtitle: mess ? `${mess.rating || 0}★ rating` : 'N/A', onPress: () => {} },
      ],
    },
    {
      title: 'Mess Settings',
      items: [
        { icon: '🏪', label: 'Edit Mess Details', subtitle: mess?.name || 'N/A', onPress: openEditMess },
        {
          icon: '⏰', label: 'Operating Hours',
          subtitle: mess?.lunchStartTime
            ? `${mess.lunchStartTime} – ${mess.dinnerEndTime || mess.lunchEndTime || '—'}`
            : 'Not set',
          onPress: openHours,
        },
        {
          icon: '🌍', label: 'Delivery Settings',
          subtitle: `${mess?.deliveryAvailable ? 'Active' : 'Inactive'} • ${mess?.deliveryRadius || 5}km radius`,
          onPress: openDelivery,
        },
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
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name || 'P')}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.vendorName} numberOfLines={1}>{user?.name || 'Provider'}</Text>
              <Text style={styles.vendorPhone} numberOfLines={1}>{user?.phone}</Text>
              {user?.email ? <Text style={styles.vendorEmail} numberOfLines={1}>{user.email}</Text> : null}
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>⭐ {mess?.rating || 0}</Text>
              </View>
            </View>
            <Pressable style={styles.editBtn} onPress={openEditProfile}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {/* Vacation Mode */}
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
                      {item.subtitle && <Text style={styles.menuSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
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
        </View>
      </ScrollView>

      {/* ── Confirm Logout ── */}
      <ConfirmModal
        visible={showLogout}
        title="Log Out"
        message="Are you sure you want to log out?"
        variant="danger"
        confirmLabel="Log Out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />

      {/* ── Edit Profile Modal ── */}
      <EditModal visible={showEditProfile} title="Edit Profile" onClose={() => setShowEditProfile(false)} onSave={saveProfile}>
        <Field label="Full Name" value={editName} onChangeText={setEditName} placeholder="Enter your name" autoCapitalize="words" />
        <Field label="Email Address" value={editEmail} onChangeText={setEditEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
      </EditModal>

      {/* ── Edit Mess Details Modal ── */}
      <EditModal visible={showEditMess} title="Edit Mess Details" onClose={() => setShowEditMess(false)} onSave={saveMessDetails}>
        <Field label="Mess Name" value={editMessName} onChangeText={setEditMessName} placeholder="Enter mess name" autoCapitalize="words" />
        <Field label="Description" value={editMessDesc} onChangeText={setEditMessDesc} placeholder="Tell customers about your mess" />
      </EditModal>

      {/* ── Operating Hours Modal ── */}
      <EditModal visible={showHours} title="Operating Hours" onClose={() => setShowHours(false)} onSave={saveHours}>
        <Text style={hourStyles.subheading}>Lunch</Text>
        <View style={hourStyles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Start" value={lunchStart} onChangeText={setLunchStart} placeholder="12:00" />
          </View>
          <View style={hourStyles.separator} />
          <View style={{ flex: 1 }}>
            <Field label="End" value={lunchEnd} onChangeText={setLunchEnd} placeholder="15:00" />
          </View>
        </View>
        <Text style={hourStyles.subheading}>Dinner</Text>
        <View style={hourStyles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Start" value={dinnerStart} onChangeText={setDinnerStart} placeholder="19:00" />
          </View>
          <View style={hourStyles.separator} />
          <View style={{ flex: 1 }}>
            <Field label="End" value={dinnerEnd} onChangeText={setDinnerEnd} placeholder="22:00" />
          </View>
        </View>
        <Text style={hourStyles.hint}>Use 24-hour format, e.g. 12:00 or 19:30</Text>
      </EditModal>

      {/* ── Delivery Settings Modal ── */}
      <EditModal visible={showDelivery} title="Delivery Settings" onClose={() => setShowDelivery(false)} onSave={saveDelivery}>
        <View style={deliveryStyles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={deliveryStyles.toggleLabel}>Home Delivery</Text>
            <Text style={deliveryStyles.toggleSub}>Accept delivery orders</Text>
          </View>
          <Switch
            value={deliveryAvailable}
            onValueChange={setDeliveryAvailable}
            trackColor={{ false: Colors.borderLight, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
        <Field
          label="Delivery Radius (km)"
          value={deliveryRadius}
          onChangeText={setDeliveryRadius}
          placeholder="5"
          keyboardType="numeric"
        />
      </EditModal>

      {/* ── Banking Details Modal ── */}
      <EditModal visible={showBank} title="Banking Details" onClose={() => setShowBank(false)} onSave={saveBank}>
        <Field label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="e.g. State Bank of India" autoCapitalize="words" />
        <Field label="Account Number *" value={accountNumber} onChangeText={setAccountNumber} placeholder="Enter account number" keyboardType="numeric" autoCapitalize="none" />
        <Field label="Account Holder Name *" value={accountHolderName} onChangeText={setAccountHolderName} placeholder="Name on the account" autoCapitalize="words" />
        <Field label="IFSC Code *" value={ifscCode} onChangeText={(t) => setIfscCode(t.toUpperCase())} placeholder="e.g. SBIN0001234" autoCapitalize="none" />
        <Field label="UPI ID" value={upiId} onChangeText={setUpiId} placeholder="e.g. name@upi" autoCapitalize="none" />
      </EditModal>
    </>
  );
}

const hourStyles = StyleSheet.create({
  subheading: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  separator: { width: 1, backgroundColor: Colors.borderLight, alignSelf: 'center', height: 40, marginTop: Spacing.lg },
  hint: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
});

const deliveryStyles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight },
  toggleLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  toggleSub: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
});

function makeStyles(
  width: number,
  isNarrow: boolean,
  isTablet: boolean,
  hPad: number,
  avatarSize: number,
) {
  const nameFontSize = isNarrow ? FontSizes.lg : isTablet ? FontSizes.xxl : FontSizes.xl;
  const pageTitleSize = isNarrow ? FontSizes.xxl : isTablet ? FontSizes.display : FontSizes.xxxl;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingBottom: 100, alignItems: isTablet ? 'center' : undefined },
    contentWrapper: { width: '100%', maxWidth: isTablet ? 600 : undefined, alignSelf: isTablet ? 'center' : undefined },
    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingHorizontal: hPad,
      paddingBottom: Spacing.lg,
      backgroundColor: Colors.surface,
    },
    pageTitle: { fontSize: pageTitleSize, fontWeight: FontWeights.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
    profileCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.surface, margin: hPad,
      borderRadius: BorderRadius.xl, padding: isNarrow ? Spacing.lg : Spacing.xl,
      ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight,
    },
    avatar: {
      width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
      backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
      marginRight: isNarrow ? Spacing.md : Spacing.lg, flexShrink: 0,
    },
    avatarText: { color: Colors.textInverse, fontSize: isNarrow ? FontSizes.xl : isTablet ? FontSizes.xxxl : FontSizes.xxl, fontWeight: FontWeights.bold },
    profileInfo: { flex: 1, minWidth: 0 },
    vendorName: { fontSize: nameFontSize, fontWeight: FontWeights.bold, color: Colors.textPrimary, flexShrink: 1 },
    vendorPhone: { fontSize: isNarrow ? FontSizes.xs : FontSizes.sm, color: Colors.textTertiary, marginTop: 2, flexShrink: 1 },
    vendorEmail: { fontSize: isNarrow ? FontSizes.xs : FontSizes.sm, color: Colors.textTertiary, marginTop: 1, flexShrink: 1 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
    ratingText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.warning },
    editBtn: { paddingHorizontal: isNarrow ? Spacing.sm : Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryBg, flexShrink: 0 },
    editBtnText: { color: Colors.primary, fontSize: isNarrow ? FontSizes.xs : FontSizes.sm, fontWeight: FontWeights.bold },
    vacation: {
      marginHorizontal: hPad, backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl, paddingHorizontal: isNarrow ? Spacing.lg : Spacing.xl,
      ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.lg,
    },
    section: { marginBottom: Spacing.lg, paddingHorizontal: hPad },
    sectionTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: isNarrow ? Spacing.lg : Spacing.xl, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: isNarrow ? Spacing.md : Spacing.lg, gap: Spacing.md },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    menuIcon: { fontSize: isNarrow ? 18 : 20 },
    menuLabel: { fontSize: isNarrow ? FontSizes.sm : FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
    menuSubtitle: { fontSize: isNarrow ? FontSizes.xs : FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
    chevron: { fontSize: 22, color: Colors.textTertiary },
    logoutBtn: {
      marginHorizontal: hPad, paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.xl, backgroundColor: Colors.surface,
      alignItems: 'center', ...Shadows.sm,
      borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.error },
    version: { textAlign: 'center', color: Colors.textTertiary, fontSize: FontSizes.xs, marginTop: Spacing.xl },
  });
}
