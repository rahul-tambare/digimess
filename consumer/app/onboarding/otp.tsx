import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserStore } from '@/stores/dataStore';
import { authApi } from '@/services/api';
import { FormInput } from '@/components/FormInput';
import { ArrowLeft } from 'lucide-react-native';

const otpSchema = z.object({
  otp: z.string().length(6, 'Please enter a valid 6-digit OTP')
});

type OtpFormData = z.infer<typeof otpSchema>;

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [countdown, setCountdown] = useState(30);
  const login = useUserStore(state => state.login);
  const loginAsNewUser = useUserStore(state => state.loginAsNewUser);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) { timer = setInterval(() => setCountdown(c => c - 1), 1000); }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (data: OtpFormData) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await authApi.verifyOTP(phone, data.otp);
      if (res.token && res.user) {
        login(res.token, res.user);
        router.replace(res.isNewUser ? '/onboarding/profile' : '/(tabs)');
      } else {
        // New user without token — go to profile setup
        loginAsNewUser(phone);
        router.replace('/onboarding/profile');
      }
    } catch (err: any) {
      // Fallback for offline / dev testing: accept 123456
      if (data.otp === '123456') {
        loginAsNewUser(phone);
        router.replace('/onboarding/profile');
      } else {
        setErrorMsg(err.message || 'Verification failed. Try 123456 for testing.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={s.title}>Verify OTP</Text>
          <Text style={s.subtitle}>
            We've sent a 6-digit code to <Text style={s.phoneBold}>+91 {phone}</Text>
          </Text>

          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Enter OTP (Test: 123456)"
                placeholder="------"
                keyboardType="number-pad"
                maxLength={6}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.otp?.message || errorMsg}
                textAlign="center"
              />
            )}
          />

          <View style={s.resendRow}>
            <Text style={s.resendLabel}>Didn't receive code?</Text>
            <TouchableOpacity disabled={countdown > 0} onPress={() => setCountdown(30)}>
              <Text style={[s.resendBtn, countdown > 0 && { color: '#CBD5E1' }]}>
                Resend OTP {countdown > 0 ? `(${countdown}s)` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[s.btn, !isValid && s.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>Verify & Proceed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500', lineHeight: 22, marginBottom: 32 },
  phoneBold: { fontWeight: '700', color: '#475569' },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  resendLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  resendBtn: { color: '#FF6B35', fontSize: 14, fontWeight: '700' },
  btn: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#FF6B35',
  },
  btnDisabled: { backgroundColor: '#FFB699' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
