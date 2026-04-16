import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail } from 'lucide-react-native';
import { useUserStore } from '@/stores/dataStore';
import { userApi } from '@/services/api';
import { FormInput } from '@/components/FormInput';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const updateUser = useUserStore(state => state.updateUser);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      await userApi.updateProfile({ name: data.name, email: data.email || undefined });
    } catch (err) {
      console.log('Profile API update failed, saving locally:', err);
    }
    updateUser({ name: data.name });
    setSaving(false);
    router.replace('/onboarding/location');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <View style={s.logoBadge}><Text style={{ fontSize: 28 }}>🎯</Text></View>

          <Text style={s.title}>Almost there!</Text>
          <Text style={s.subtitle}>Tell us a bit about yourself so we can personalize your experience</Text>

          <Controller control={control} name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Full Name" placeholder="Priya Mehta" onBlur={onBlur}
                onChangeText={onChange} value={value} error={errors.name?.message}
                leftIcon={<User size={18} color="#94A3B8" />} />
            )} />
          <Controller control={control} name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Email (Optional)" placeholder="priya@example.com" keyboardType="email-address"
                onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message}
                leftIcon={<Mail size={18} color="#94A3B8" />} />
            )} />

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={[s.btn, !isValid && s.btnDisabled]} onPress={handleSubmit(onSubmit)}
            disabled={!isValid} activeOpacity={0.8}>
            <Text style={s.btnText}>Continue to Location</Text>
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
    width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500', lineHeight: 22, marginBottom: 32 },
  btn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#FF6B35' },
  btnDisabled: { backgroundColor: '#FFB699' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
