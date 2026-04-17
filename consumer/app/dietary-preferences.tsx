import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Utensils } from 'lucide-react-native';
import { useUserStore } from '@/stores/dataStore';
import { userApi } from '@/services/api';

const DIET_OPTIONS = ['Veg', 'Non-Veg', 'Both'] as const;

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  const updateUser = useUserStore(state => state.updateUser);
  const [selectedDiet, setSelectedDiet] = useState(user?.dietaryPreference || '');
  const [saving, setSaving] = useState(false);

  const handleSaveDiet = async (diet: string) => {
    setSelectedDiet(diet);
    setSaving(true);
    try {
      await userApi.updateProfile({ dietaryPreference: diet });
      updateUser({ dietaryPreference: diet });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update preference');
      setSelectedDiet(user?.dietaryPreference || '');
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
          <Text style={styles.headerTitle}>Dietary Preferences</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Utensils size={18} color="#475569" />
            <Text style={styles.sectionTitle}>Dietary Preference</Text>
            {saving && <ActivityIndicator size="small" color="#FF6B35" style={{ marginLeft: 8 }} />}
          </View>
          <Text style={styles.sectionSubtitle}>This helps us personalise your meal recommendations.</Text>
          <View style={styles.optionGrid}>
            {DIET_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionCard, selectedDiet === opt && styles.optionCardActive]}
                onPress={() => handleSaveDiet(opt)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <Text style={[styles.optionText, selectedDiet === opt && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  section: { backgroundColor: '#FFF', marginTop: 8, padding: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 16 },
  optionGrid: { flexDirection: 'row', gap: 10 },
  optionCard: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  optionCardActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  optionText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  optionTextActive: { color: '#FFF' },
});
