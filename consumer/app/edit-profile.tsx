import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Utensils } from 'lucide-react-native';
import { useUserStore } from '@/stores/dataStore';
import { userApi } from '@/services/api';
import { FormInput } from '@/components/FormInput';

const editProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

const DIET_OPTIONS = ['Veg', 'Non-Veg', 'Both'] as const;

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  const updateUser = useUserStore(state => state.updateUser);
  const [saving, setSaving] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState(user?.dietaryPreference || '');

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    mode: 'onChange',
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: EditProfileData) => {
    setSaving(true);
    try {
      await userApi.updateProfile({
        name: data.name,
        email: data.email || undefined,
        dietaryPreference: selectedDiet || undefined,
      });
      updateUser({ name: data.name, email: data.email || undefined, dietaryPreference: selectedDiet || undefined });
      Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
            <Text style={styles.phoneLabel}>{user?.phone || ''}</Text>
          </View>

          {/* Form */}
          <Controller control={control} name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Full Name" placeholder="Enter your name" onBlur={onBlur}
                onChangeText={onChange} value={value} error={errors.name?.message}
                leftIcon={<User size={18} color="#94A3B8" />} />
            )} />
          <Controller control={control} name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Email (Optional)" placeholder="you@example.com" keyboardType="email-address"
                onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message}
                leftIcon={<Mail size={18} color="#94A3B8" />} />
            )} />

          {/* Dietary Preference */}
          <Text style={styles.fieldLabel}>Dietary Preference</Text>
          <View style={styles.dietRow}>
            {DIET_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.dietChip, selectedDiet === opt && styles.dietChipActive]}
                onPress={() => setSelectedDiet(opt)}
                activeOpacity={0.7}
              >
                <Utensils size={14} color={selectedDiet === opt ? '#FFF' : '#64748B'} />
                <Text style={[styles.dietChipText, selectedDiet === opt && styles.dietChipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  content: { padding: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FF6B35' },
  phoneLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10, letterSpacing: 0.3 },
  dietRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  dietChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  dietChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  dietChipText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  dietChipTextActive: { color: '#FFF' },
  saveBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#FF6B35', marginTop: 8 },
  saveBtnDisabled: { backgroundColor: '#FFB699' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
