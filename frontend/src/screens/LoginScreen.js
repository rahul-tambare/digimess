import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';

const COLORS = {
  primary: '#f26d21',
  primaryDark: '#a14000',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  outline: '#8c7166',
};

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetOTP = async () => {
    console.log('Get OTP clicked. Phone:', phone);
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      navigation.navigate('OTPVerification', { phone });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍱</Text>
          </View>
          <Text style={styles.brandName}>Digi Mess</Text>
          <Text style={styles.brandSubtitle}>Your digital culinary companion</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>Enter your mobile number to get started</Text>

          {/* Phone input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📞</Text>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor={COLORS.outline + '80'}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGetOTP}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Get OTP</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Promo Card */}
        <View style={styles.promoCard}>
          <View style={styles.promoTextWrapper}>
            <Text style={styles.promoLabel}>NEW SEASON SPECIALS</Text>
            <Text style={styles.promoBody}>Join 5,000+ foodies managing their daily meals seamlessly.</Text>
          </View>
          <View style={styles.promoImageBox}>
            <Text style={{ fontSize: 40 }}>🍗</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLinks}>Terms of Service  ·  Privacy Policy</Text>
        <Text style={styles.footerCopy}>© 2024 Digi Mess. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  keyboardView: { flex: 1, paddingHorizontal: 24, paddingTop: 40, justifyContent: 'center' },
  brandSection: { alignItems: 'center', marginBottom: 48 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#f26d21', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
    transform: [{ rotate: '-3deg' }],
  },
  logoEmoji: { fontSize: 36 },
  brandName: { fontFamily: 'System', fontWeight: '800', fontSize: 36, color: COLORS.primary, marginBottom: 4 },
  brandSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant },
  formSection: { marginBottom: 32 },
  welcomeTitle: { fontWeight: '700', fontSize: 24, color: COLORS.onSurface, marginBottom: 6 },
  welcomeSubtitle: { fontSize: 15, color: COLORS.onSurfaceVariant, marginBottom: 28 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14,
    paddingHorizontal: 16, height: 64, marginBottom: 20,
    shadowColor: '#f26d21', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 2,
  },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 17, color: COLORS.onSurface },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 64, borderRadius: 9999,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 6, gap: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  buttonArrow: { color: '#fff', fontSize: 20 },
  promoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 20, padding: 20, gap: 16,
  },
  promoTextWrapper: { flex: 1 },
  promoLabel: { fontSize: 11, color: COLORS.secondary, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  promoBody: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18 },
  promoImageBox: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
  },
  footer: { alignItems: 'center', paddingBottom: 24, paddingTop: 8 },
  footerLinks: { fontSize: 13, color: COLORS.outline, marginBottom: 4 },
  footerCopy: { fontSize: 11, color: COLORS.onSurfaceVariant + '99' },
});
