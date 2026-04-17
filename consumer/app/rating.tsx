import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { reviewApi } from '@/services/api';

export default function RatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = (params.id as string) || '';
  const messName = (params.messName as string) || 'Your Order';

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const tags = ['Tasty', 'Fresh', 'Generous portions', 'Good packaging', 'On time', 'Hygienic'];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    
    reviewApi.getOrderReview(orderId)
      .then(res => {
        setRating(res.rating || 0);
        
        let text = res.reviewText || '';
        if (text.startsWith('Tags: ')) {
          const match = text.match(/^Tags:\s*([^.]+)\.\s*(.*)/);
          if (match) {
             const parsedTags = match[1].split(',').map((s: string) => s.trim());
             setSelectedTags(parsedTags);
             setReview(match[2]);
          } else {
             // could be just tags without text
             const pureMatch = text.match(/^Tags:\s*(.*)/);
             if (pureMatch) {
                const parsedTags = pureMatch[1].split(',').map((s: string) => s.trim());
                setSelectedTags(parsedTags);
                setReview('');
             }
          }
        } else {
          setReview(text);
        }
        
        setIsEditing(true);
      })
      .catch(e => {
        // Not found, new review
        setIsEditing(false);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!orderId) {
      alert("Order ID is missing.");
      return;
    }
    setSubmitting(true);
    try {
      let combinedReview = review;
      if (selectedTags.length > 0) {
        const tagText = `Tags: ${selectedTags.join(', ')}`;
        combinedReview = combinedReview ? `${tagText}. ${combinedReview}` : tagText;
      }
      
      if (isEditing) {
        await reviewApi.updateReview(orderId, {
          rating,
          reviewText: combinedReview
        });
        alert("Review updated successfully!");
      } else {
        await reviewApi.submitReview(orderId, {
          rating,
          reviewText: combinedReview
        });
        alert("Thank you for your feedback!");
      }
      router.replace('/(tabs)/orders');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error submitting review. Please try again later");
    } finally {
      setSubmitting(false);
    }
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
        <Text style={s.subtitle}>{messName}</Text>

        {loading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ marginTop: 12, color: '#94A3B8' }}>Loading existing review...</Text>
          </View>
        ) : (
          <>
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

            <TouchableOpacity 
              style={[s.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={s.submitBtnText}>{submitting ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}</Text>
            </TouchableOpacity>
          </>
        )}
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
