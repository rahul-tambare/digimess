import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock, TrendingUp, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDataStore } from '@/stores/dataStore';
import { MessCard } from '@/components/MessCard';

export default function SearchScreen() {
  const router = useRouter();
  const messes = useDataStore(state => state.searchResults);
  const loading = useDataStore(state => state.loading);
  const searchMesses = useDataStore(state => state.searchMesses);
  const fetchMesses = useDataStore(state => state.fetchMesses);
  const [query, setQuery] = useState('');

  const recentSearches = ['Maharashtrian Thali', 'Jain food near me', 'Tiffin service'];
  const popularCategories = [
    { label: 'Thali', emoji: '🥘' },
    { label: 'South Indian', emoji: '🥞' },
    { label: 'Tiffin', emoji: '🍱' },
    { label: 'Jain', emoji: '🥗' },
    { label: 'North Indian', emoji: '🫓' },
    { label: 'Chinese', emoji: '🥡' },
  ];

  // Debounced API search
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      searchMesses(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = query.trim() ? messes : [];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        {/* Search Input */}
        <View style={styles.searchHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.searchInputWrap}>
            <Search size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messes, cuisines, thalis..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {query.length === 0 ? (
          <>
            {/* Recent Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.map((s, i) => (
                <TouchableOpacity key={i} style={styles.recentRow} onPress={() => setQuery(s)}>
                  <Clock size={16} color="#94A3B8" />
                  <Text style={styles.recentText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Popular Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Categories</Text>
              <View style={styles.catGrid}>
                {popularCategories.map((cat, i) => (
                  <TouchableOpacity key={i} style={styles.catChip} onPress={() => setQuery(cat.label)}>
                    <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                    <Text style={styles.catChipText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : results.length > 0 ? (
          <>
            <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} found</Text>
            {results.map(mess => (
              <MessCard key={mess.id} {...mess} type={mess.type as 'veg' | 'non-veg' | 'both'} onPress={() => router.push(`/mess/${mess.id}`)} />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try searching for a different cuisine or mess</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    marginLeft: 10,
    paddingVertical: 0,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  recentText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
      default: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  resultCount: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 16,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
  },
});
