import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const FAQS = [
  { id: '1', q: 'How does Digi Mess work?', a: 'Digi Mess connects you with nearby home-kitchen mess providers. Browse menus, place one-time orders or subscribe to daily meal plans, and get fresh home-cooked food delivered to your door.' },
  { id: '2', q: 'How do I subscribe to a meal plan?', a: 'Go to any mess profile and tap "View Plans" or visit the Subscriptions page from your profile. Select a plan that suits your needs, choose a start date, and pay using your wallet balance.' },
  { id: '3', q: 'Can I skip a day on my subscription?', a: 'Yes! With Bi-Weekly and Monthly plans, you can skip any day before midnight the previous day. Simply go to My Subscriptions and tap "Skip Tomorrow".' },
  { id: '4', q: 'How do I add money to my wallet?', a: 'Go to Profile → Payment Methods → Wallet and tap "Top Up". You can add money via UPI or Credit/Debit Card. Early-bird top-ups of ₹2000+ get bonus credits!' },
  { id: '5', q: 'What if my food is late or incorrect?', a: 'You can report any issue within 30 minutes of delivery from the order tracking screen. Our support team will resolve it and credit your wallet if needed.' },
  { id: '6', q: 'How do I cancel a subscription?', a: 'Go to My Subscriptions, select the active plan, and tap "Cancel Plan". A prorated refund will be credited to your wallet within 24 hours.' },
  { id: '7', q: 'Is there a minimum order amount?', a: 'No minimum order for individual meals. Subscription plans have a fixed price per plan. Delivery is free for all subscription orders.' },
];

export default function FAQScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & FAQs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={s.pageTitle}>Frequently Asked Questions</Text>
        <Text style={s.pageSub}>Everything you need to know about Digi Mess</Text>

        {FAQS.map((faq) => {
          const expanded = expandedId === faq.id;
          return (
            <TouchableOpacity key={faq.id} style={s.card} activeOpacity={0.8}
              onPress={() => setExpandedId(expanded ? null : faq.id)}>
              <View style={s.questionRow}>
                <Text style={s.question}>{faq.q}</Text>
                {expanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
              </View>
              {expanded && (
                <View style={s.answerWrap}>
                  <Text style={s.answer}>{faq.a}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  pageSub: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginBottom: 24 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
      android: { elevation: 1 },
      default: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
    }),
  },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1, paddingRight: 12 },
  answerWrap: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  answer: { fontSize: 14, lineHeight: 22, color: '#64748B', fontWeight: '500' },
});
