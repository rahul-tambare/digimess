// ==========================================
// Auth Screen — Splash → Phone → OTP
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import { authApi, messApi } from '../services/api';

type AuthStep = 'splash' | 'phone' | 'otp';

export default function AuthScreen() {
  const router = useRouter();
  const { login, loginAsNewUser, isAuthenticated, token, hydrate } = useAuthStore();
  const [step, setStep] = useState<AuthStep>('splash');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Hydrate auth from persistence + auto-redirect
  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Already logged in — check if has mess and redirect
      const checkAndRedirect = async () => {
        try {
          const messes = await messApi.getMyMesses();
          if (messes && messes.length > 0) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        } catch {
          router.replace('/(tabs)');
        }
      };
      checkAndRedirect();
      return;
    }
  }, [isAuthenticated, token]);

  // Splash auto-transition
  useEffect(() => {
    if (isAuthenticated && token) return; // Skip splash if already authed
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const timer = setTimeout(() => setStep('phone'), 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, token]);

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError('Enter a valid 10-digit Indian phone number');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOTP(cleaned);
      setStep('otp');
      setResendTimer(30);
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(phone, code, 'vendor');
      login(res.token, res.user);
      // Check if vendor has a mess already
      try {
        const messes = await messApi.getMyMesses();
        if (messes && messes.length > 0) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        // If mess check fails, go to onboarding
        router.replace('/onboarding');
      }
    } catch (e: any) {
      setError(e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authApi.sendOTP(phone);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to resend');
    }
  };

  // ===================== SPLASH =====================
  if (step === 'splash') {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <View style={styles.splashIconCircle}>
          <Text style={styles.splashIcon}>🍽️</Text>
        </View>
        <Text style={styles.splashTitle}>DigiMess</Text>
        <Text style={styles.splashSubtitle}>Provider Partner</Text>
        <View style={styles.splashDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    );
  }

  // ===================== PHONE =====================
  if (step === 'phone') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.emoji}>📱</Text>
            <Text style={styles.title}>Welcome, Provider!</Text>
            <Text style={styles.subtitle}>Enter your phone number to get started</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={[styles.phoneInput, error && styles.inputError]}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.textTertiary}
                value={phone}
                onChangeText={(t) => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Pressable
            style={[styles.primaryBtn, (!phone || phone.length < 10) && styles.primaryBtnDisabled]}
            onPress={handleSendOtp}
            disabled={loading || phone.length < 10}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Send OTP →</Text>
            )}
          </Pressable>

          <Text style={styles.footerNote}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ===================== OTP =====================
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>

        <View style={styles.headerSection}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>+91 {phone}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => { otpRefs.current[idx] = ref; }}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled,
                error && styles.otpBoxError,
              ]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, idx)}
              onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, idx)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={idx === 0}
            />
          ))}
        </View>

        {error ? <Text style={[styles.errorText, { textAlign: 'center' }]}>{error}</Text> : null}

        {loading && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.verifyingText}>Verifying...</Text>
          </View>
        )}

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.helpBox}>
          <Text style={styles.helpText}>💡 Use <Text style={{ fontWeight: '800' }}>111111</Text> as master OTP for testing</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  splashIcon: {
    fontSize: 48,
  },
  splashTitle: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.extrabold,
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  splashSubtitle: {
    fontSize: FontSizes.lg,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeights.medium,
    marginTop: Spacing.xs,
  },
  splashDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.huge,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: Colors.textInverse,
    width: 24,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  backBtnText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.semibold,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: {
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  inputSection: {
    marginBottom: Spacing.xxl,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  prefixBox: {
    width: 64,
    height: 56,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginTop: Spacing.sm,
    fontWeight: FontWeights.medium,
  },
  primaryBtn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.border,
  },
  primaryBtnText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  footerNote: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  verifyingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  verifyingText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  resendTimer: {
    fontSize: FontSizes.md,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
  },
  resendLink: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  helpBox: {
    backgroundColor: Colors.infoBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  helpText: {
    fontSize: FontSizes.sm,
    color: Colors.infoDark,
  },
});
