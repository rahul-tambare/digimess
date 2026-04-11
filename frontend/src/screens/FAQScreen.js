import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';

const FAQScreen = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await api.get('/user/faqs');
      setFaqs(response.data);
    } catch (err) {
      console.error('Failed to fetch FAQs', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#005fb8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & FAQs</Text>
        <Text style={styles.subtitle}>Frequently asked questions about Digimess</Text>
      </View>

      {faqs.map((faq, index) => (
        <TouchableOpacity 
          key={faq.id} 
          style={styles.faqCard}
          onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
          activeOpacity={0.7}
        >
          <View style={styles.questionRow}>
            <Text style={styles.question}>{faq.question}</Text>
            <MaterialCommunityIcons 
              name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#666" 
            />
          </View>
          {expandedIndex === index && (
            <View style={styles.answerContainer}>
              <Text style={styles.answer}>{faq.answer}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {faqs.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No FAQs available at the moment.</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  faqCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    paddingRight: 12,
  },
  answerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  }
});

export default FAQScreen;
