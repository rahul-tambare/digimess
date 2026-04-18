import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Share, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Heart, Star, MapPin, Clock, Info } from 'lucide-react-native';
import { useDataStore, useCartStore } from '@/stores/dataStore';
import { ThaliCard } from '@/components/ThaliCard';
import { CartSummaryBar } from '@/components/CartSummaryBar';

export default function MessDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const mess = useDataStore(state => state.messes.find(m => m.id === id));
  const thalis = useDataStore(state => state.thalis);
  const items = useDataStore(state => state.items);
  const reviews = useDataStore(state => state.reviews);
  const favorites = useDataStore(state => state.favorites);
  const toggleFavorite = useDataStore(state => state.toggleFavorite);
  const isFavorite = favorites.includes(id);
  const fetchMessDetail = useDataStore(state => state.fetchMessDetail);
  const fetchThalis = useDataStore(state => state.fetchThalis);
  const allThalis = useMemo(() => thalis.filter(t => t.messId === id), [thalis, id]);
  const [activeTab, setActiveTab] = useState<'All' | 'Thalis' | 'Items' | 'Reviews' | 'Info'>('All');
  const [activeMealTime, setActiveMealTime] = useState('All');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const cartItems = useCartStore(state => state.items);
  const addToCart = useCartStore(state => state.addToCart);
  const incrementQuantity = useCartStore(state => state.incrementQuantity);
  const decrementQuantity = useCartStore(state => state.decrementQuantity);
  const clearCart = useCartStore(state => state.clearCart);

  const handleAddToCart = (messIdParam: string, messNameParam: string, item: any) => {
    try {
      addToCart(messIdParam, messNameParam, item);
    } catch (e: any) {
      if (e.message === 'MULTIPLE_MESS_ERROR') {
        Alert.alert(
          'Different Mess',
          'Your cart contains items from a different mess. Clear your cart and add this item?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Clear & Add', 
              style: 'destructive',
              onPress: () => {
                clearCart();
                addToCart(messIdParam, messNameParam, item);
              }
            }
          ]
        );
      } else {
        throw e;
      }
    }
  };

  // Fetch mess detail + thalis from API
  useEffect(() => {
    if (id) {
      setLoadingDetail(true);
      fetchMessDetail(id).finally(() => setLoadingDetail(false));
    }
  }, [id]);

  if (!mess) return <View style={s.container}><Text>Mess not found</Text></View>;

  const filteredThalis = activeMealTime === 'All'
    ? allThalis
    : allThalis.filter(t => t.mealTime.toLowerCase() === activeMealTime.toLowerCase());

  const handleShare = async () => {
    try { await Share.share({ message: `Check out ${mess.name} on MessWala!` }); } catch (e) { }
  };

  const tabs = ['All', 'Thalis', 'Items', 'Reviews', 'Info'] as const;
  const mealTimes = ['All', 'Breakfast', 'Lunch', 'Dinner'];

  return (
    <View style={s.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={s.cover}>
          <Image source={{ uri: mess.coverImage }} style={s.coverImage} resizeMode="cover" />
          <View style={[s.coverControls, { paddingTop: Math.max(insets.top, 16) }]} pointerEvents="box-none">
            <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={s.coverRight} pointerEvents="box-none">
              <TouchableOpacity onPress={handleShare} style={s.iconBtn}>
                <Share2 size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleFavorite(id)} style={s.iconBtn}>
                <Heart size={18} color={isFavorite ? "#EF4444" : "#FFF"} fill={isFavorite ? "#EF4444" : "transparent"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info Panel */}
        <View style={s.infoPanel}>
          <View style={s.titleRow}>
            <Text style={s.messName}>{mess.name}</Text>
            <View style={[s.vegDot, { backgroundColor: mess.type === 'veg' ? '#22C55E' : '#EF4444' }]} />
          </View>
          <Text style={s.tags}>{mess.tags.join(' • ')}</Text>

          <View style={s.metricsRow}>
            <View style={s.metric}>
              <Star size={15} color="#EAB308" fill="#EAB308" />
              <Text style={s.metricBold}>{mess.rating}</Text>
              <Text style={s.metricLight}>({mess.reviewCount})</Text>
            </View>
            <View style={s.divider} />
            <View style={s.metric}>
              <MapPin size={15} color="#94A3B8" />
              <Text style={s.metricValue}>{mess.distanceKm} km</Text>
            </View>
            <View style={s.divider} />
            <View style={s.metric}>
              <Clock size={15} color="#94A3B8" />
              <Text style={s.metricValue}>{mess.deliveryTimeMin} min</Text>
            </View>
          </View>

          {/* Subscription Banner */}
          {mess.hasSubscription && (
            <TouchableOpacity style={s.subBanner} onPress={() => router.push({ pathname: '/subscription-plans', params: { messId: mess.id } })} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={s.subBannerTitle}>🎫 Subscribe & Save 15%</Text>
                <Text style={s.subBannerSub}>Get daily meals from this mess at a flat rate</Text>
              </View>
              <View style={s.subBannerBtn}>
                <Text style={s.subBannerBtnText}>View Plans →</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={s.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.tab, activeTab === tab && s.tabActive]}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={s.content}>
          {(activeTab === 'All' || activeTab === 'Thalis') && (
            <View style={{ marginBottom: activeTab === 'All' ? 24 : 0 }}>
              {activeTab === 'All' && allThalis.length > 0 && <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#0F172A' }}>Thalis & Combos</Text>}
              {activeTab === 'Thalis' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {mealTimes.map((m) => (
                    <TouchableOpacity key={m} onPress={() => setActiveMealTime(m)}
                      style={[s.mealChip, activeMealTime === m && s.mealChipActive]}>
                      <Text style={[s.mealChipText, activeMealTime === m && s.mealChipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {(activeTab === 'All' ? allThalis : filteredThalis).map(thali => {
                const qty = cartItems.find(i => i.thaliId === thali.id)?.qty || 0;
                return (
                  <ThaliCard key={thali.id} {...thali} type={thali.type as 'veg' | 'non-veg'} quantity={qty}
                    onAdd={() => handleAddToCart(mess.id, mess.name, { thaliId: thali.id, name: thali.name, price: thali.discountedPrice || thali.price, qty: 1, isSubscriptionThali: thali.isSubscriptionThali, subscriptionExtraCharge: thali.subscriptionExtraCharge })}
                    onIncrement={() => incrementQuantity(thali.id)}
                    onDecrement={() => decrementQuantity(thali.id)}
                  />
                );
              })}
              {activeTab === 'All' && allThalis.length === 0 && items.length === 0 && (
                <View style={s.emptyTab}>
                  <Text style={{ fontSize: 40 }}>🍽️</Text>
                  <Text style={s.emptyText}>No items available</Text>
                </View>
              )}
            </View>
          )}
          {(activeTab === 'All' || activeTab === 'Items') && (
            <View>
              {activeTab === 'All' && items.length > 0 && <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#0F172A' }}>Individual Items</Text>}
              {items.length > 0 ? items.map(item => {
                const qty = cartItems.find(i => i.thaliId === item.id)?.qty || 0;
                return (
                  <ThaliCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    mealTime="All Day"
                    type={item.isVeg ? 'veg' : 'non-veg'}
                    items={item.description}
                    price={item.price}
                    image={item.image}
                    available={item.available}
                    quantity={qty}
                    onAdd={() => handleAddToCart(mess.id, mess.name, { thaliId: item.id, name: item.name, price: item.price, qty: 1 })}
                    onIncrement={() => incrementQuantity(item.id)}
                    onDecrement={() => decrementQuantity(item.id)}
                  />
                );
              }) : (
                activeTab === 'Items' ? (
                  <View style={s.emptyTab}>
                    <Text style={{ fontSize: 40 }}>📋</Text>
                    <Text style={s.emptyText}>No individual items available</Text>
                  </View>
                ) : null
              )}
            </View>
          )}
          {activeTab === 'Reviews' && (
            <View>
              {reviews && reviews.length > 0 ? (
                reviews.map(review => (
                  <View key={review.id} style={s.reviewCard}>
                    <View style={s.reviewHeader}>
                      <View style={s.reviewAuthor}>
                        <View style={s.reviewAvatar}>
                          <Text style={s.reviewAvatarText}>{(review.userName || 'U')[0].toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={s.reviewName}>{review.userName || 'Anonymous User'}</Text>
                          <Text style={s.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <View style={s.reviewRating}>
                        <Star size={12} color="#FFF" fill="#FFF" />
                        <Text style={s.reviewRatingText}>{review.rating}</Text>
                      </View>
                    </View>
                    {review.reviewText ? <Text style={s.reviewText}>{review.reviewText}</Text> : null}
                    {(review.foodQuality || review.deliveryTime) && (
                      <View style={s.reviewTags}>
                        {review.foodQuality && <Text style={s.reviewTag}>{review.foodQuality}</Text>}
                        {review.deliveryTime && <Text style={s.reviewTag}>{review.deliveryTime}</Text>}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={s.emptyTab}>
                  <Text style={{ fontSize: 40 }}>⭐</Text>
                  <Text style={s.emptyText}>No reviews yet</Text>
                </View>
              )}
            </View>
          )}
          {activeTab === 'Info' && (
            <View style={s.infoCard}>
              <Info size={20} color="#FF6B35" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.infoTitle}>About the kitchen</Text>
                <Text style={s.infoDesc}>Authentic home-cooked meals prepared with love and hygiene. We specialize in rich regional recipes passed down through generations.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <CartSummaryBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  cover: { height: 240, backgroundColor: '#1E293B', position: 'relative' },
  coverImage: { width: '100%', height: '100%', opacity: 0.8 },
  coverControls: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10, elevation: 10 },
  coverRight: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  infoPanel: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24,
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  messName: { fontSize: 22, fontWeight: '800', color: '#0F172A', flex: 1, letterSpacing: -0.3 },
  vegDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  tags: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 16 },
  metricsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14,
  },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricBold: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  metricLight: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  metricValue: { fontSize: 13, fontWeight: '600', color: '#475569', marginLeft: 2 },
  divider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tab: { paddingVertical: 14, marginRight: 28, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#FF6B35' },
  tabText: { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
  tabTextActive: { color: '#FF6B35' },
  content: { padding: 20, paddingBottom: 120 },
  mealChip: {
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 10,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  mealChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  mealChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  mealChipTextActive: { color: '#FFF' },
  emptyTab: { alignItems: 'center', paddingTop: 40, opacity: 0.5 },
  emptyText: { color: '#94A3B8', fontWeight: '600', marginTop: 8 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF',
    padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9',
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  infoDesc: { fontSize: 13, color: '#64748B', fontWeight: '500', lineHeight: 20 },
  subBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderRadius: 14, padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: '#A7F3D0', borderStyle: 'dashed',
  },
  subBannerTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  subBannerSub: { fontSize: 11, color: '#047857', fontWeight: '500', marginTop: 2 },
  subBannerBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginLeft: 10 },
  subBannerBtnText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  reviewCard: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#CECECE'
  },
  reviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10
  },
  reviewAuthor: {
    flexDirection: 'row', alignItems: 'center'
  },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  reviewAvatarText: {
    fontSize: 16, fontWeight: '700', color: '#64748B'
  },
  reviewName: {
    fontSize: 14, fontWeight: '700', color: '#0F172A'
  },
  reviewDate: {
    fontSize: 11, color: '#94A3B8', marginTop: 2
  },
  reviewRating: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4
  },
  reviewRatingText: {
    color: '#FFF', fontSize: 12, fontWeight: '700'
  },
  reviewText: {
    fontSize: 13, color: '#475569', lineHeight: 20
  },
  reviewTags: {
    flexDirection: 'row', gap: 8, marginTop: 10
  },
  reviewTag: {
    fontSize: 11, color: '#64748B', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden'
  },
});
