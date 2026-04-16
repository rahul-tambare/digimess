import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function RatingScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const tags = ['Tasty', 'Fresh', 'Generous portions', 'Good packaging', 'On time', 'Hygienic'];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rate your meal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>How was the food?</Text>
        <Text style={s.subtitle}>Sunita's Home Kitchen • MW1042</Text>

        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star size={44} color={star <= rating ? "#EAB308" : "#E2E8F0"} fill={star <= rating ? "#EAB308" : "transparent"} />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <>
            <Text style={s.sectionLabel}>What did you like?</Text>
            <View style={s.tagGrid}>
              {tags.map((tag) => {
                const sel = selectedTags.includes(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => toggleTag(tag)}
                    style={[s.tag, sel && s.tagActive]}>
                    <Text style={[s.tagText, sel && s.tagTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.sectionLabel}>Write a review (optional)</Text>
            <TextInput
              style={s.textArea}
              placeholder="Tell others what you loved..."
              placeholderTextColor="#CBD5E1"
              multiline
              textAlignVertical="top"
              value={review}
              onChangeText={setReview}
            />

            <TouchableOpacity style={s.submitBtn} onPress={() => router.replace('/(tabs)/orders')}>
              <Text style={s.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center', marginBottom: 32 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12, letterSpacing: -0.2 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  tag: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  tagActive: { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: '#FF6B35' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tagTextActive: { color: '#FF6B35' },
  textArea: {
    backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 16, fontSize: 15, fontWeight: '500', color: '#0F172A', height: 120, marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
      default: { boxShadow: '0 6px 16px rgba(255,107,53,0.3)' },
    }),
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
