import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { saveToken } from '../utils/api';

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
  onSecondaryContainer: '#002204',
  outline: '#8c7166',
};

const OTP_LENGTH = 6;
const RESEND_TIMER = 59;

export default function OTPVerificationScreen({ route, navigation }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const interval = setInterval(() => {
      setTimer((t) => { if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '').slice(-1);
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      Alert.alert('Error', `Please enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp: fullOtp, role: 'customer' });
      await saveToken(res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Register device for notifications (v3.0)
      try {
        await api.post('/user/devices', {
          fcmToken: 'placeholder_token_' + Date.now(),
          deviceType: Platform.OS === 'android' ? 'android' : 'ios'
        });
      } catch (devErr) {
        console.log('Device registration failed (non-critical):', devErr);
      }

      Alert.alert('Success', 'Login successful!');
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await api.post('/auth/send-otp', { phone });
      setTimer(RESEND_TIMER);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      Alert.alert('Sent', 'A new OTP has been sent.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surfaceContainerLow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digi Mess</Text>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Verify Identity</Text>
        <Text style={styles.subtitle}>
          Enter the {OTP_LENGTH}-digit code sent to {phone}
        </Text>

        {/* Visual accent */}
        <View style={styles.iconCard}>
          <Text style={styles.iconEmoji}>📲</Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputRefs.current[i] = ref)}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="numeric"
              maxLength={1}
              placeholder="•"
              placeholderTextColor={COLORS.outline + '60'}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify and Login</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendQ}>Didn't receive the code?</Text>
          <View style={styles.resendControls}>
            {!canResend && (
              <Text style={styles.timerText}>
                00:{String(timer).padStart(2, '0')}
              </Text>
            )}
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              <Text style={[styles.resendBtn, !canResend && styles.resendDisabled]}>
                Resend code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Security badge */}
      <View style={styles.securityBadge}>
        <View style={styles.shieldIcon}>
          <Text style={{ fontSize: 22 }}>🛡️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.secureTitle}>Secure Login</Text>
          <Text style={styles.secureBody}>Your data is protected by high-end encryption standards.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  backButton: { padding: 8, borderRadius: 9999 },
  backArrow: { fontSize: 22, color: '#71717a' },
  headerTitle: { fontWeight: '700', fontSize: 18, color: COLORS.primary },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 40 },
  title: { fontWeight: '800', fontSize: 36, color: COLORS.onSurface, letterSpacing: -0.5, marginBottom: 12 },
  subtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 22, marginBottom: 36 },
  iconCard: {
    alignSelf: 'center', width: 120, height: 120, borderRadius: 9999,
    backgroundColor: COLORS.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconEmoji: { fontSize: 52 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  otpBox: {
    width: 50, height: 64, borderRadius: 14, textAlign: 'center',
    fontSize: 26, fontWeight: '700', backgroundColor: COLORS.surfaceContainerLowest,
    color: COLORS.onSurface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  otpBoxFilled: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  button: {
    height: 60, borderRadius: 9999,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  resendRow: { alignItems: 'center', gap: 6 },
  resendQ: { color: COLORS.onSurfaceVariant, fontSize: 14 },
  resendControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { color: '#a1a1aa', fontWeight: '500', fontSize: 14 },
  resendBtn: { fontWeight: '700', color: COLORS.primary, fontSize: 14 },
  resendDisabled: { opacity: 0.45 },
  securityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 24, padding: 16,
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  shieldIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  secureTitle: { fontWeight: '700', color: COLORS.onSurface, fontSize: 13, marginBottom: 2 },
  secureBody: { fontSize: 12, color: COLORS.onSurfaceVariant, lineHeight: 16 },
});
