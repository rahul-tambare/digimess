import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView,
  Platform, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';

const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e3e2e1',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  outlineVariant: '#e0c0b2',
  tertiaryFixed: '#ffdeac',
};

function StarPicker({ label, value, onChange }) {
  return (
    <View style={sp.row}>
      <Text style={sp.label}>{label}</Text>
      <View style={sp.stars}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} style={sp.starBtn}>
            <Text style={[sp.star, n <= value && sp.starFilled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#584238', flex: 1 },
  stars: { flexDirection: 'row', gap: 4 },
  starBtn: { padding: 4 },
  star: { fontSize: 28, color: '#e0c0b2' },
  starFilled: { color: '#f26d21' },
});

export default function ReviewScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [foodQuality, setFoodQuality] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert('Rating Required', 'Please select an overall rating before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/orders/${orderId}/review`, {
        rating,
        reviewText: reviewText.trim() || null,
        foodQuality: foodQuality || null,
        deliveryTime: deliveryTime || null,
      });
      Alert.alert('Thank You! 🙏', 'Your review has been submitted.', [
        { text: 'Done', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (e) {
      const msg = e.response?.data?.error || 'Failed to submit review. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 22, color: COLORS.onSurface }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Your Order</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 56 }}>⭐</Text>
          </View>
          <Text style={styles.title}>How was your experience?</Text>
          <Text style={styles.subtitle}>Your feedback helps us and our mess partners improve.</Text>

          {/* Ratings Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>OVERALL RATING</Text>
            <View style={styles.bigStars}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} style={{ padding: 6 }}>
                  <Text style={[styles.bigStar, n <= rating && styles.bigStarFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 0 && 'Tap to rate'}
              {rating === 1 && 'Poor 😞'}
              {rating === 2 && 'Fair 😐'}
              {rating === 3 && 'Good 🙂'}
              {rating === 4 && 'Great 😄'}
              {rating === 5 && 'Excellent 🤩'}
            </Text>
          </View>

          {/* Sub-ratings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>DETAILED RATINGS (OPTIONAL)</Text>
            <StarPicker label="Food Quality 🍛" value={foodQuality} onChange={setFoodQuality} />
            <StarPicker label="Delivery Time 🚀" value={deliveryTime} onChange={setDeliveryTime} />
          </View>

          {/* Text Review */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>WRITE A REVIEW (OPTIONAL)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Share your experience with this mess..."
              placeholderTextColor={COLORS.onSurfaceVariant}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || rating < 1) && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting || rating < 1}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Submit Review ⭐</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('MainTabs')}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  heroIcon: {
    width: 100, height: 100, borderRadius: 32,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24, marginTop: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, padding: 24,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.outlineVariant,
  },
  cardTitle: { fontSize: 11, fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 1, marginBottom: 20 },
  bigStars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  bigStar: { fontSize: 44, color: COLORS.surfaceContainerHighest },
  bigStarFilled: { color: '#f26d21' },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.onSurfaceVariant },
  textArea: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 16,
    fontSize: 15, color: COLORS.onSurface, minHeight: 100,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
  },
  footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 16, gap: 12 },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: 32, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipBtnText: { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
});
