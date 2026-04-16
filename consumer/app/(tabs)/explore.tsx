import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Star, MapPin, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDataStore } from '@/stores/dataStore';

export default function ExploreScreen() {
  const router = useRouter();
  const messes = useDataStore(state => state.messes);
  const loading = useDataStore(state => state.loading);
  const fetchMesses = useDataStore(state => state.fetchMesses);
  const searchMesses = useDataStore(state => state.searchMesses);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch messes on mount
  useEffect(() => {
    if (messes.length === 0) fetchMesses();
  }, []);

  // Debounced API search
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchMesses();
      return;
    }
    const timer = setTimeout(() => {
      searchMesses(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filtered = messes;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTag}>COMMUNITY FAVORITES</Text>
          <Text style={s.heroTitle}>Discover Nearby{'\n'}Messes</Text>
          <Text style={s.heroSub}>Authentic home-style cooking delivered from local kitchens to your table.</Text>

          <View style={s.searchBar}>
            <Search size={20} color="#94A3B8" />
            <TextInput
              style={s.searchInput}
              placeholder="Search by name, cuisine..."
              placeholderTextColor="#CBD5E1"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={s.filterBtn}>
              <SlidersHorizontal size={18} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <View style={s.content}>
          <Text style={s.sectionTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : 'Top-Rated Restaurants'}
          </Text>

          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={s.emptyText}>No matching messes found</Text>
            </View>
          ) : (
            filtered.map((mess) => (
              <TouchableOpacity
                key={mess.id}
                style={s.card}
                activeOpacity={0.9}
                onPress={() => router.push(`/mess/${mess.id}`)}
              >
                <View style={s.imageWrap}>
                  <Image source={{ uri: mess.coverImage }} style={s.cardImage} resizeMode="cover" />
                  <View style={s.ratingBadge}>
                    <Star size={12} color="#EAB308" fill="#EAB308" />
                    <Text style={s.ratingText}>{mess.rating}</Text>
                  </View>
                  {mess.hasSubscription && (
                    <View style={s.subBadge}>
                      <Text style={s.subBadgeText}>SUBSCRIPTION</Text>
                    </View>
                  )}
                </View>
                <View style={s.cardInfo}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardName} numberOfLines={1}>{mess.name}</Text>
                    <Text style={s.cardPrice}>₹{mess.priceRange.min}–{mess.priceRange.max}</Text>
                  </View>
                  <View style={s.cardMeta}>
                    <MapPin size={13} color="#94A3B8" />
                    <Text style={s.metaText}>{mess.distanceKm} km</Text>
                    <View style={s.metaDot} />
                    <Clock size={13} color="#94A3B8" />
                    <Text style={s.metaText}>{mess.deliveryTimeMin} min</Text>
                    <View style={s.metaDot} />
                    <Text style={s.metaText}>{mess.tags.slice(0, 2).join(' • ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  heroTag: { fontSize: 11, fontWeight: '800', color: '#FF6B35', letterSpacing: 1.5, marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#0F172A', lineHeight: 38, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: '#94A3B8', fontWeight: '500', lineHeight: 22, marginBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16,
    paddingHorizontal: 16, height: 56, gap: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: { boxShadow: '0 4px 12px rgba(255,107,53,0.05)' },
    }),
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', color: '#0F172A' },
  filterBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 16, letterSpacing: -0.3 },
  card: {
    marginBottom: 20, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      default: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
    }),
  },
  imageWrap: { height: 180, backgroundColor: '#E2E8F0', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  subBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: '#FF6B35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  subBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  cardInfo: { padding: 16 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 8 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#FF6B35' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#94A3B8', fontWeight: '600', marginTop: 12, fontSize: 15 },
});
