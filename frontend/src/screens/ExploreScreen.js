import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';
import { useCart } from '../utils/CartContext';



// MySQL JSON columns may come back already parsed or as a string
const getFirstImage = (images, fallback = 'https://dummyimage.com/600x400/ccc/fff.jpg&text=No+Image') => {
  try {
    const arr = Array.isArray(images) ? images : JSON.parse(images);
    return (arr && arr.length > 0) ? arr[0] : fallback;
  } catch { return fallback; }
};

const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  outline: '#8c7166',
};

const MESSES = [
  { name: "Mother's Grace Mess", cost: "$120/mo", rating: "4.8", dist: "1.2 km", tags: "North Indian", badge: "Organic", img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARse548jnqIF3gWSn50MekIIBJ-8BwSJ1HBTJ90o_7XoMgvTYJ55WDWaYRzvGQbDBb2KpEBMh0HnRTied_3QRpkUfHhzSIpL-piq0aNV3h_W0y7ESL_iPinl4t1TAGiL4XbKh_nkFVdNztcpe7fVeC3jzmM53ZpRx3fXooimZE2qg-U58_kzb22c_hXCCqLUnNLEuEMvW7DYQ-5SoDjZtXH9sMp5I1flqhdZNad093r1F_Jqhavk62a1F5UsIzDs8w4uMhyhMNz3s' },
  { name: "Sahyadri Kitchen", cost: "$110/mo", rating: "4.6", dist: "0.8 km", tags: "Maharashtrian", badge: "Popular", img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqxcSf_4KTxeFl1-nCqttGqZKhRy8MT-wYZGAIvJ3xNv-Ym1Q2wMWyiy-j8ltfR51ZddLBFsiuhpIKUuywT9v7N-p2OYHn9IMrliotqEH6H_-9RY9evG9_ZPNogR2k5z1DHzBBHzhxaBIPdfYPzxlLmv6tNtOswrr7cWfAdPgc2T0lVJiWBAXTVU094c2aKYvoWLdp7TjhtN93cSIPXcCa__3VloMZdjP2zNPOyAe9jipDmieg2VeQyQ4bJUmzeLhPi_sDkwrdKXw' },
  { name: "The Royal Tiffin", cost: "$145/mo", rating: "4.9", dist: "2.5 km", tags: "Multicuisine", badge: "Gourmet", img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBo6NWplYNo3nlje6HtSMvB6DOR6wmbhNt8AHghW7lj3G03DAQAs2dVGAnMkQ5ywOefZd10l2-jEEJdKBu_nZ2ZceZ4EdwJOWtJg1RfJwwDffUGEBHGxxZXqCfwUvV3UjPCfvH26cMCHehNWmxhV7wdE5pM5PbZFOSgW8RyfwKfzloi1RAvtkCM1_ff0glpaO9_CJafivPJj76ZQFAc2h-HxaUm8O6HL9EsafLuUIM0BIzvYKLUV_6Xz1MT1feE0TIKI2EPRIfETuo' },
];

export default function ExploreScreen({ navigation }) {
  const [messes, setMesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const { totalItems } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [messesRes, configRes] = await Promise.all([
          api.get(`/messes?search=${searchQuery}`),
          api.get('/config')
        ]);
        setMesses(messesRes.data);
        setConfig(configRes.data);
      } catch (err) {
        console.log('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header navigation={navigation} noTopInset={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Discover Nearby Messes</Text>
          <Text style={styles.heroSubtitle}>Authentic home-style cooking delivered from local kitchens to your table.</Text>
          <View style={styles.searchBar}>
            <Text style={{fontSize: 20, marginRight: 10}}>🔍</Text>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search by name, address..." 
              placeholderTextColor={COLORS.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Top Rated */}
        <View style={styles.sectionHeader}>
          <Text style={styles.accentText}>COMMUNITY FAVORITES</Text>
          <Text style={styles.sectionTitle}>Top-Rated Restaurants</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 40}} />
        ) : messes.length === 0 ? (
          <Text style={{textAlign: 'center', color: COLORS.onSurfaceVariant, marginTop: 40}}>{searchQuery ? 'No matching messes found.' : 'No messes available at the moment.'}</Text>
        ) : (
          messes.map((m, i) => {
            const imgUrl = getFirstImage(m.images);
            return (
              <TouchableOpacity key={i} style={styles.messCard} activeOpacity={0.9} onPress={() => navigation.navigate('MessProfile', { messId: m.id })}>
                <View style={styles.messImageContainer}>
                  <Image source={{uri: imgUrl}} style={styles.messImage} />
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {m.rating || 'New'}</Text>
                  </View>
                  <View style={styles.badgeLabel}>
                    <Text style={styles.badgeText}>Open</Text>
                  </View>
                </View>
                <View style={styles.messInfo}>
                  <View style={styles.messRow}>
                    <Text style={styles.messName}>{m.name}</Text>
                    <Text style={styles.messCost}>Starting {config.currencySymbol || '₹'}120</Text>
                  </View>
                  <Text style={styles.messMeta}>{m.address} • Indian</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Floating Action Button (Cart) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Cart')}
      >
        <Text style={{fontSize: 24, color: '#fff'}}>🛍️</Text>
        {totalItems > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: 24 },
  heroSection: { marginBottom: 32 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: COLORS.onSurface, marginBottom: 12, lineHeight: 42 },
  heroSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, marginBottom: 24, lineHeight: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 99, paddingHorizontal: 20, height: 64, shadowColor: COLORS.primary, shadowOffset: {height: 4, width: 0}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.onSurface },
  sectionHeader: { marginBottom: 20 },
  accentText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 1, marginBottom: 4 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  messCard: { marginBottom: 24 },
  messImageContainer: { height: 200, borderRadius: 24, overflow: 'hidden', marginBottom: 16, backgroundColor: COLORS.surfaceContainerLow },
  messImage: { width: '100%', height: '100%' },
  ratingBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  ratingText: { fontSize: 12, fontWeight: '800', color: COLORS.onSurface },
  badgeLabel: { position: 'absolute', bottom: 16, left: 16, backgroundColor: COLORS.primaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  messRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  messName: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface, flex: 1, marginRight: 8 },
  messCost: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  messMeta: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: COLORS.primaryContainer, shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.3, shadowRadius: 10 },
  fabBadge: { position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  fabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' }
});
