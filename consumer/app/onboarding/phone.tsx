import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput';
import { authApi } from '@/services/api';

const phoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number')
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: PhoneFormData) => {
    setSending(true);
    try {
      await authApi.sendOTP(data.phone);
    } catch (err) {
      // Continue even if API is down (offline dev mode)
      console.log('sendOTP call failed, continuing in dev mode:', err);
    } finally {
      setSending(false);
    }
    router.push({ pathname: '/onboarding/otp', params: { phone: data.phone } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          {/* Brand Logo */}
          <View style={s.logoBadge}>
            <Text style={{ fontSize: 32 }}>🍛</Text>
          </View>

          <Text style={s.title}>Welcome to MessWala 👋</Text>
          <Text style={s.subtitle}>Enter your phone number to continue or create an account</Text>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Phone Number"
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                leftIcon={<Text style={s.prefix}>+91</Text>}
                error={errors.phone?.message}
              />
            )}
          />

          <View style={{ flex: 1 }} />

          <Text style={s.terms}>By continuing, you agree to our Terms of Service & Privacy Policy</Text>

          <TouchableOpacity
            style={[s.btn, !isValid && s.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.08)', justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500', lineHeight: 22, marginBottom: 32 },
  prefix: { color: '#475569', fontWeight: '600', fontSize: 15 },
  terms: { textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: '500', marginBottom: 16 },
  btn: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#FF6B35',
  },
  btnDisabled: { backgroundColor: '#FFB699' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
