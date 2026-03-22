import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
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
  surfaceContainerHigh: '#e9e8e7',
  tertiaryFixed: '#ffdeac'
};

const THALIS = [
  { name: 'Royal Maratha Thali', price: '₹180', cals: '26g Protein', tag: 'Gluten Free Option', desc: 'Puran Poli, Katachi Amti, Bharli Vangi, Indrayani Rice, and Sajuk Tup.', badge: 'BEST SELLER', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1nHu4CFHkrDCi9pJCF-k2wZgUE6i-QL1zh_1WJHvAEhbY98tNvJo9-QaMOdIVw3O1YQQKNMPf0wdNU1ABScRV6aX_-45ceRXQQIf-SmuEETWuxZoIOJP-kyhFVGJIk17_PX02KExZqlAJSzOHGXT5jByInUUXuGPsyn6TlxoBsa1sMoQlkQQIkSWdFF4m8LJO36JTx4rIqG0AM_aIEMXGNUdBRS6qLSiyPUhuEYu_0Kluc2CuPUfSpFrs92CPH0v9rCE7DrWkrhs' },
  { name: 'Executive High-Fiber', price: '₹150', cals: '12g Fiber', tag: 'Low Calorie', desc: 'Jowar Bhakri, Methi Chi Bhaji, Pithla, Sprouts Salad, and Buttermilk.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYjQXhAI10iEi5ivDKuvAlM-PVrvEydT9MWNGstwoQH-cbn9HdmvZAdWf9CX_qlaMY1AzHD6sOrAGi6WmfNZvIcscWhPctVKxesOmQ2gvWfcYOINAcFrtxVHIGIGh6qjpgs9P56FAyA4i_fvopUmMbEInly0IwpDvIE_UW6zQpQNArbp8YnsvylnGAvhPc5HsedIf9LfDWqDFDdbpG5TWHFbdKmrTMkFH6y40IUwZ60472oAP2doNgkD11MlxkoFFZF_pfBhBlYjs' },
  { name: 'The Village Special', price: '₹210', cals: 'High Energy', tag: '', desc: 'Special Batata Rassa, Masale Bhat, Solkadhi, and Papad variety.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOibbUmYLKZ9s9u2sgvG3mFpDVsdHoT0CYLMorhLN2aOvP9ZytAktfaG05yCdxi74XQAM_WCxlRO8o_a_eO5gZIvMXzoCzedoBrnSLQhPvOuVPBmjS3kICUQK5mKPBfhoha9TwYtZnN4YmUMZNGKpT_wSTNAxake8I27d-Kq0BhWEKziGirO2tLUTevfv7RjTqFX-TpSEd1Vy9x3vAy3AEW9VSQBDzvikVCApSMVj5JFY9ecb5rrEYsf8EeP6qIYy4WoCza--rr_0' }
];

export default function MessProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const messId = route.params?.messId;

  const [mess, setMess] = useState(null);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [messRes, plansRes] = await Promise.all([
          api.get(`/messes/${messId}`),
          api.get('/plans')
        ]);
        setMess(messRes.data);
        setPlans(plansRes.data);
      } catch (err) {
        console.log('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (messId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [messId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!mess) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ textAlign: 'center', fontSize: 18 }}>Mess not found or failed to load.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.primary, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imgUrl = getFirstImage(mess.images);

  return (
    <View style={styles.container}>
      {/* Absolute Transparent Header for Back Button */}
      <View style={[styles.header, { top: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>♥</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* Full Image Hero */}
        <ImageBackground source={{uri: imgUrl}} style={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTags}>
              {mess.rating > 4.5 && <View style={styles.premiumBadge}><Text style={styles.premiumText}>PREMIUM MESS</Text></View>}
              <View style={styles.ratingBadge}><Text style={styles.ratingText}>⭐ {mess.rating}</Text></View>
            </View>
            <Text style={styles.heroTitle}>{mess.name}</Text>
            <Text style={styles.heroSubtitle}>{mess.description}</Text>
            <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate('ConfirmSubscription')}>
              <Text style={styles.subscribeText}>Subscribe Now →</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoTitle}>Service Hours</Text>
            <Text style={styles.infoDesc}>Lunch: 12:30 PM - 3:30 PM{'\n'}Dinner: 7:30 PM - 10:30 PM</Text>
          </View>
          <View style={[styles.infoCard, {backgroundColor: 'rgba(160,243,153,0.3)', borderColor: 'rgba(160,243,153,0.5)', borderWidth: 1}]}>
            <Text style={styles.infoIcon}>🌱</Text>
            <Text style={styles.infoTitle}>Sustainability</Text>
            <Text style={styles.infoDesc}>100% biodegradable packaging & organic grains directly from farmers.</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoTitle}>Kitchen Hub</Text>
            <Text style={styles.infoDesc}>{mess.address}</Text>
          </View>
        </View>

        {/* Daily Menu */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Menu</Text>
          <Text style={styles.sectionSubtitle}>Handcrafted thalis available for today's service</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
          {(!mess.menu || mess.menu.length === 0) ? (
            <Text style={{color: COLORS.onSurfaceVariant, fontStyle: 'italic', paddingHorizontal: 24}}>Menu items preparing...</Text>
          ) : (
            mess.menu.map((t, i) => {
              const mImg = getFirstImage(t.images, 'https://dummyimage.com/600x400/ccc/fff.jpg&text=Food');
              return (
                <View key={i} style={styles.thaliCard}>
                  <View style={styles.thaliImageContainer}>
                    <Image source={{uri: mImg}} style={styles.thaliImage} />
                  </View>
                  <View style={styles.thaliContent}>
                    <View style={styles.thaliHeaderRow}>
                      <Text style={styles.thaliName}>{t.itemName}</Text>
                      <Text style={styles.thaliPrice}>₹{t.price}</Text>
                    </View>
                    {/* Veg / Non-veg badge + calories + category */}
                    <View style={styles.thaliTagsRow}>
                      <View style={[styles.thaliTag, { backgroundColor: t.isVeg ? 'rgba(160,243,153,0.4)' : 'rgba(255,80,80,0.12)' }]}>
                        <Text style={[styles.thaliTagText, { color: t.isVeg ? '#005312' : '#8b0000' }]}>
                          {t.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                        </Text>
                      </View>
                      {t.calories ? (
                        <View style={[styles.thaliTag, { backgroundColor: 'rgba(255,219,172,0.5)' }]}>
                          <Text style={[styles.thaliTagText, { color: '#3f2a00' }]}>🔥 {t.calories} kcal</Text>
                        </View>
                      ) : null}
                      {t.category ? (
                        <View style={[styles.thaliTag, { backgroundColor: 'rgba(226,226,226,0.6)' }]}>
                          <Text style={[styles.thaliTagText, { color: '#333' }]}>{t.category}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.thaliDesc}>{t.itemDescription}</Text>
                    <TouchableOpacity 
                      style={styles.addToMealBtn}
                      onPress={() => {
                        addToCart({ id: t.id, name: t.itemName, price: t.price });
                        alert(`${t.itemName} added to your tray!`);
                      }}
                    >
                      <Text style={styles.addToMealText}>Add to Meal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Subscriptions */}
        <View style={[styles.sectionHeader, { marginTop: 40 }]}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          <Text style={styles.sectionSubtitle}>Commit to wellness with our curated monthly memberships</Text>
        </View>

        <View style={{paddingHorizontal: 24, gap: 24}}>
          {Object.values(plans).flat().map((plan, idx) => {
            const isPremium = plan.categoryName === 'Premium';
            return (
              <View 
                key={plan.id} 
                style={isPremium ? styles.planCardSecondary : styles.planCardMain}
              >
                <View style={styles.planHeaderRow}>
                  <View style={{flex: 1, marginRight: 10}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Text style={isPremium ? styles.planTitleDark : styles.planTitleWhite}>{plan.name}</Text>
                      {isPremium && <View style={styles.popBadge}><Text style={styles.popBadgeText}>POPULAR</Text></View>}
                    </View>
                    <Text style={isPremium ? styles.planSubtitleDark : styles.planSubtitleWhite}>{plan.description}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end', minWidth: 80}}>
                    <Text style={isPremium ? styles.planPriceDark : styles.planPriceWhite}>₹{plan.price}</Text>
                    <Text style={isPremium ? styles.planFreqDark : styles.planFreqWhite}>/month</Text>
                  </View>
                </View>
                
                {!isPremium && (
                  <View style={styles.planFeatures}>
                    {plan.benefits && plan.benefits.map((benefit, bIdx) => (
                      <Text key={bIdx} style={styles.planFeatureText}>{benefit}</Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity 
                  style={isPremium ? styles.planAddBtn : styles.planSubscribeBtn} 
                  onPress={() => navigation.navigate('ConfirmSubscription', { planId: plan.id })}
                >
                  <Text style={isPremium ? styles.planAddText : styles.planSubscribeText}>
                    {isPremium ? 'Select Plan' : 'Start Subscription'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { position: 'absolute', left: 24, right: 24, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: COLORS.onSurface, fontWeight: '800' },
  actionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 22, color: COLORS.onSurface },
  heroImage: { width: '100%', height: 420, justifyContent: 'flex-end' },
  heroOverlay: { padding: 24, backgroundColor: 'rgba(0,0,0,0.4)', paddingTop: 60 },
  heroTags: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  premiumBadge: { backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  premiumText: { color: '#005312', fontSize: 10, fontWeight: '800' },
  ratingBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 40, marginBottom: 8 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 20 },
  subscribeBtn: { alignSelf: 'flex-start', backgroundColor: COLORS.primaryContainer, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99 },
  subscribeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  infoGrid: { paddingHorizontal: 24, paddingVertical: 32, gap: 16 },
  infoCard: { backgroundColor: COLORS.surfaceContainerLow, padding: 24, borderRadius: 24 },
  infoIcon: { fontSize: 32, marginBottom: 16 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  infoDesc: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 28, fontWeight: '800', color: COLORS.onSurface },
  sectionSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  menuScroll: { paddingHorizontal: 24, gap: 20, paddingBottom: 20 },
  thaliCard: { width: 300, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  thaliImageContainer: { height: 200, width: '100%' },
  thaliImage: { width: '100%', height: '100%' },
  thaliBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  thaliBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  thaliContent: { padding: 24 },
  thaliHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  thaliName: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, flex: 1 },
  thaliPrice: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  thaliTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  thaliTag: { backgroundColor: 'rgba(160,243,153,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  thaliTagText: { fontSize: 10, fontWeight: '800', color: '#005312', textTransform: 'uppercase' },
  thaliDesc: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 20, marginBottom: 20 },
  addToMealBtn: { backgroundColor: COLORS.surfaceContainerHigh, width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  addToMealText: { color: COLORS.onSurface, fontWeight: '800', fontSize: 15 },
  planCardMain: { backgroundColor: COLORS.primary, borderRadius: 32, padding: 32, shadowColor: COLORS.primary, shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  planTitleWhite: { fontSize: 24, fontWeight: '800', color: '#fff' },
  planSubtitleWhite: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  planPriceWhite: { fontSize: 28, fontWeight: '900', color: '#fff' },
  planFreqWhite: { fontSize: 12, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end' },
  planFeatures: { gap: 12, marginBottom: 32 },
  planFeatureText: { color: '#fff', fontSize: 14 },
  planSubscribeBtn: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  planSubscribeText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  planCardSecondary: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 32, padding: 32, borderWidth: 1, borderColor: 'rgba(140,113,102,0.2)' },
  planTitleDark: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  popBadge: { backgroundColor: COLORS.tertiaryFixed, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  popBadgeText: { fontSize: 10, fontWeight: '800', color: '#3f2a00' },
  planSubtitleDark: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  planPriceDark: { fontSize: 28, fontWeight: '900', color: COLORS.onSurface },
  planFreqDark: { fontSize: 12, color: COLORS.onSurfaceVariant, alignSelf: 'flex-end' },
  planAddBtn: { backgroundColor: COLORS.onSurface, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  planAddText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
