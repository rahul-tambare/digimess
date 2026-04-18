import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StyleSheet, Platform, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Bell, Search, SlidersHorizontal, ChevronDown, Flame, Clock, Star, Sparkles, ChevronRight } from 'lucide-react-native';
import { useUserStore, useDataStore } from '@/stores/dataStore';
import { MessCard } from '@/components/MessCard';
import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { LocationPickerModal } from '@/components/LocationPickerModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  const updateUser = useUserStore(state => state.updateUser);
  const messes = useDataStore(state => state.messes);
  const loading = useDataStore(state => state.loading);
  const fetchMesses = useDataStore(state => state.fetchMesses);
  const favorites = useDataStore(state => state.favorites);
  const toggleFavorite = useDataStore(state => state.toggleFavorite);
  const fetchFavorites = useDataStore(state => state.fetchFavorites);

  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [activeMealFilter, setActiveMealFilter] = useState('All');
  const [selectedQuickCat, setSelectedQuickCat] = useState<string | null>(null);
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});
  
  const [page, setPage] = useState(1);
  const hasMore = useDataStore(state => state.hasMore);

  const applyFilters = (targetPage = 1) => {
    const params: any = {};
    if (activeMealFilter !== 'All') params.mealTime = activeMealFilter.toLowerCase();
    if (selectedQuickCat) params.search = selectedQuickCat;
    if (extraFilters.type) params.type = extraFilters.type;
    if (extraFilters.distance) params.distance = extraFilters.distance;
    if (extraFilters.delivery) params.delivery = extraFilters.delivery;
    if (extraFilters.price) params.price = extraFilters.price;
    if (extraFilters.diet) params.diet = extraFilters.diet;

    fetchMesses(params, targetPage);
  };

  useEffect(() => {
    setPage(1);
    applyFilters(1);
  }, [activeMealFilter, selectedQuickCat, extraFilters, user?.location]);

  // Fetch initial favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
  const firstName = user?.name?.split(' ')[0] || 'Foodie';

  const mealFilters = [
    { label: 'All', emoji: '🍽️' },
    { label: 'Breakfast', emoji: '🥐' },
    { label: 'Lunch', emoji: '🍛' },
    { label: 'Dinner', emoji: '🍲' },
  ];

  const quickCategories = [
    { label: 'Thali', emoji: '🥘', bg: '#FFF7ED' },
    { label: 'Tiffin', emoji: '🍱', bg: '#FFFBEB' },
    { label: 'South Indian', emoji: '🥞', bg: '#FEF9C3' },
    { label: 'Jain', emoji: '🥗', bg: '#F0FDF4' },
    { label: 'Rice & Dal', emoji: '🍚', bg: '#ECFDF5' },
    { label: 'Roti Sabzi', emoji: '🫓', bg: '#F7FEE7' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    applyFilters(1);
    await fetchFavorites();
    setRefreshing(false);
  };

  const handleMessPress = (id: string) => {
    router.push(`/mess/${id}`);
  };

  const handleEndReached = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      applyFilters(nextPage);
    }
  };

  const renderHeader = () => (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FF6B35' }}>
        {/* ═══════ HEADER ═══════ */}
        <View style={styles.header}>
          {/* Row 1: Greeting + Bell */}
          <View style={styles.headerRow1}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{firstName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.greetingText}>{greeting} {greetingEmoji}</Text>
              <Text style={styles.nameText}>{firstName}!</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn}>
              <Bell size={22} color="#FFF" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>

          {/* Row 2: Location Pill */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => setLocationModalVisible(true)} style={styles.locationPill}>
            <MapPin size={16} color="#FFF" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.locationLabel}>DELIVERING TO</Text>
              <Text style={styles.locationValue} numberOfLines={1}>
                {user?.location?.area || 'Select Location'}
              </Text>
            </View>
            <ChevronDown size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Row 3: Search Bar */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/search')} style={styles.searchBar}>
            <Search size={20} color="#FF6B35" />
            <Text style={styles.searchPlaceholder}>Search messes, thalis, cuisines...</Text>
            <View style={styles.searchFilterIcon}>
              <SlidersHorizontal size={16} color="#FF6B35" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Quick Categories */}
      <View style={{ paddingVertical: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {quickCategories.map((cat, idx) => {
            const active = selectedQuickCat === cat.label;
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.catItem, active && { opacity: 0.8 }]} 
                activeOpacity={0.7}
                onPress={() => setSelectedQuickCat(active ? null : cat.label)}
              >
                <View style={[styles.catIcon, { backgroundColor: cat.bg, borderWidth: active ? 2 : 1, borderColor: active ? '#FF6B35' : '#F1F5F9' }]}>
                  <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
                </View>
                <Text style={[styles.catLabel, active && { color: '#FF6B35', fontWeight: '800' }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Promo Cards */}
      <View style={{ paddingHorizontal: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={SCREEN_WIDTH - 56} snapToAlignment="start">
          {/* Card 1 */}
          <View style={[styles.promoCard, { backgroundColor: '#1E293B' }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.promoTag}>
                <Flame size={12} color="#FDE68A" />
                <Text style={styles.promoTagText}>Limited Offer</Text>
              </View>
              <Text style={styles.promoTitle}>50% OFF</Text>
              <Text style={styles.promoSub}>on your first subscription</Text>
              <View style={styles.promoCode}>
                <Text style={styles.promoCodeText}>CODE: WELCOME50</Text>
              </View>
            </View>
            <View style={styles.promoEmoji}>
              <Text style={{ fontSize: 56 }}>🍛</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={[styles.promoCard, { backgroundColor: '#059669' }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.promoTag}>
                <Sparkles size={12} color="#A7F3D0" />
                <Text style={styles.promoTagText}>New</Text>
              </View>
              <Text style={styles.promoTitle}>Fresh Kitchens 🧑‍🍳</Text>
              <Text style={styles.promoSub}>5 new messes near you</Text>
            </View>
            <View style={styles.promoEmoji}>
              <Text style={{ fontSize: 56 }}>👨‍🍳</Text>
            </View>
          </View>

          {/* Card 3 */}
          <View style={[styles.promoCard, { backgroundColor: '#7C3AED' }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.promoTag}>
                <Star size={12} color="#DDD6FE" />
                <Text style={styles.promoTagText}>Top Rated</Text>
              </View>
              <Text style={styles.promoTitle}>Weekly Plans</Text>
              <Text style={styles.promoSub}>Subscribe & save ₹200/week</Text>
            </View>
            <View style={styles.promoEmoji}>
              <Text style={{ fontSize: 56 }}>📦</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Meal Time Selector */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={styles.sectionTitle}>What are you craving?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {mealFilters.map((meal) => {
            const active = activeMealFilter === meal.label;
            return (
              <TouchableOpacity
                key={meal.label}
                onPress={() => setActiveMealFilter(meal.label)}
                style={[styles.mealChip, active && styles.mealChipActive]}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>{meal.emoji}</Text>
                <Text style={[styles.mealChipText, active && styles.mealChipTextActive]}>{meal.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Near you 📍</Text>
          <Text style={styles.sectionSubtitle}>Based on your current location</Text>
        </View>
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterBtn} activeOpacity={0.7}>
          <SlidersHorizontal size={14} color="#FF6B35" />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size="small" color="#FF6B35" style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messes}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={renderFooter()}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading && page === 1 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{ color: '#94A3B8', marginTop: 12, fontWeight: '600' }}>Loading messes...</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 48 }}>🍽️</Text>
              <Text style={{ color: '#94A3B8', marginTop: 12, fontWeight: '600', fontSize: 15 }}>No messes match your criteria</Text>
            </View>
          )
        }
        renderItem={({ item: mess }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <MessCard 
              key={mess.id} 
              {...mess} 
              type={mess.type as 'veg' | 'non-veg' | 'both'} 
              onPress={() => handleMessPress(mess.id)} 
              isFavorite={favorites.includes(mess.id)}
              onFavoritePress={() => toggleFavorite(mess.id)}
            />
          </View>
        )}
      />

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => {
          setExtraFilters(filters);
          setFilterVisible(false);
        }}
        onClear={() => {
          setExtraFilters({});
          setFilterVisible(false);
        }}
      />

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        initialLocation={user?.location}
        onSelect={async (loc) => {
          await updateUser({ location: loc });
          fetchMesses();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // ── Header ──
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  greetingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  nameText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  // ── Location Pill ──
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  locationValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  // ── Search Bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    }),
  },
  searchPlaceholder: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  searchFilterIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Categories ──
  catItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 64,
  },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  // ── Promo Cards ──
  promoCard: {
    width: SCREEN_WIDTH - 56,
    height: 148,
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 6 },
      default: { boxShadow: '0 8px 16px rgba(0,0,0,0.12)' },
    }),
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  promoTagText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  promoSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  promoCode: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  promoCodeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  promoEmoji: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Meal Chips ──
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  mealChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  mealChipTextActive: {
    color: '#FFF',
  },
  // ── Section ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
      default: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    }),
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
