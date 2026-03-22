import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';
import { useCart } from '../utils/CartContext';




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

export default function HomeScreen({ navigation }) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart, totalItems } = useCart();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/config');
        setConfig(response.data);
      } catch (e) {
        console.error('Failed to fetch app config', e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (

    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surfaceContainerLow} />
      
      <Header navigation={navigation} noTopInset={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subscription Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContent}>
            <View style={styles.limitedBadge}><Text style={styles.limitedText}>LIMITED OFFER</Text></View>
            <Text style={styles.heroTitle}>{config.heroTitle || 'Monthly Subscription'}</Text>
            <Text style={styles.heroBody}>{config.heroSubtitle || 'Get unlimited access to premium home-cooked meals. Save 40% on daily dining.'}</Text>
            <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate('ConfirmSubscription')}>
              <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroImageContainer}>
            <Image 
              source={{uri: config.heroImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqAqgZ1KKpVBjNKgGyrpc36_z2qrJ1CTimpnFwSG_mI0aS70qYteToXy6NLZXdCVVOXsjwv-VdRL8WV-z8aO4VJN3tGVjug9lOU8CYMse1pB4h_grrPDydpJFplDDTBxSZJMMPAf8TLSZdBkGEZzasdQM8_V9AcnzLIagFJw4uatBd_G5BF-q_dpBFfCmW-ueXeLhEHaTlYHHz1k_-bCNajtWtWEwo2cZn358gdp7QZFsV512yKnBdWpPyizH1UwaCo2WKeXKRyn0'}} 
              style={styles.heroImage} 
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Curated Categories</Text>
          <Text style={styles.sectionSubtitle}>Explore your appetite</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {[
            { name: 'Veg Thali', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeCUJDDv_GNoH1_VfkXRj1N0G6vdAYf84zF0eBPJ26XJZAA0M2EQPWHSNGPGuu-WDtaEqkyizFVj1VXo3BjaYi19jq8qhDLqWH-9WoZUyQPq0D6RIU1DrrZrBPjqHJYwY_8rXLa2njbEgeWk_byeJM1EztiW9O7AcVzyx4Gi3FOOXNtfShUskugQS86uco0VnX0IBQkY1ajn5t30oMok3lL5gCllxsZ5m6TzwGIHmH-rCyCEGLgqrrBbEZ9sVF6GCjUECTX6tIdaA' },
            { name: 'Non-Veg', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zNwb0IIeDQODYWyFLpNC1lTYuFaFv-WfD1hyfec_pFSXk_r7YkDYd2sULGNgXGJzhM91pPQ9w_rEHG1D40XZpXNN5I70R2QNPztGcMITz9GRP7f6HnxND71uwaMNDxe6CKOjFUSq0bx_Z5dHdzFJSn60OjRU6rcugLAT3AAsugMspa0iu6ydOANi21EuIoa3rrcAsroIz22meJR9b8ITKebH1GHvBN8qgyl9vA0Q43RiLcRXqeMdYizVty_P3V7etxTxe0enGKM' },
            { name: 'Keto', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE8Muy4yaHicvu0K3FbX0yxrs7Rvask4Y29aTike-boB4LgPeyfi9y9dkhX8RT8JTxC5UjEkW0fuNQnY8PD0QdJPTvg-9bcSK7kwYKBejmkwJsou2LEByYMFbT73IkAM9RslMvBfFHYVxzLSfr98FW2DEO0jcTmVnU0iIulOcEFqYT3Sz2OPt9KhIybQuqpsdJfWqWbhx7e6olew6E-UtI7mgKmcd4IVC3H2PHrysvpqwLzosvBYfrlrPaZQ9xuOalufWT0ddLYHU' },
          ].map((cat, i) => (
            <TouchableOpacity key={cat.name} style={styles.categoryCard} activeOpacity={0.9}>
              <Image source={{uri: cat.img}} style={styles.categoryImage} />
              <View style={styles.categoryOverlay}>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Specials Bento Box */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Today's Specials</Text>
          <Text style={styles.sectionSubtitle}>Chef-crafted seasonal menus</Text>
        </View>

        <View style={styles.bentoLargeCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16}}>
            <View>
              <View style={styles.bentoBadge}><Text style={styles.bentoBadgeText}>BEST SELLER</Text></View>
              <Text style={styles.bentoTitle}>Mediterranean Harvest Bowl</Text>
            </View>
            <View style={{alignItems: 'center', flexDirection: 'row'}}>
              <Text style={styles.kcalText}>🍃 420 kcal</Text>
            </View>
          </View>
          <Image source={{uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwQBhjlZWfk9ILMEShWAm2Qz6qIfO-wIaZOnP12IGRHLf8FDVZ9sx-FNyVPvOt-RUcYO3OuMgG8dOlZjkeHkBvlRSM7Gz1NgPZo4gYwFDjHNKRd7YjXiF3v3TQ5rAedAcvj9XHHYB7pnju3q_6Lt5O5MfTMTSB8y3QeVpeOAx-rJAIJLgYB9_tqW3oICxc_sb55zHdUX0BrVDygM1iSIAHmn0iqRkWGXeJpE2lKbGY52oLgz7Cfl6Hok8R4ap44_ObZnmJFo9K_Uw'}} style={styles.bentoImage} />
          <TouchableOpacity 
            style={styles.addToTrayBtn} 
            onPress={() => {
              addToCart({ id: 'special-harvest-bowl', name: 'Mediterranean Harvest Bowl', price: 120 });
              // Optional: navigation.navigate('MessProfile') if desired, 
              // but user said "Add to meal is not working", suggesting they want selection.
            }}
          >
            <Text style={styles.addToTrayText}>Add to Tray</Text>
            <Text style={styles.addToTrayIcon}>+</Text>
          </TouchableOpacity>
        </View>

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
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: 24 },
  heroCard: {
    backgroundColor: COLORS.primary, borderRadius: 32, padding: 24, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOffset: {height: 12, width: 0}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  heroTextContent: { flex: 1, paddingRight: 10, zIndex: 1 },
  limitedBadge: { alignSelf: 'flex-start', backgroundColor: '#ffffff30', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, marginBottom: 16 },
  limitedText: { color: '#fff', fontSize: 10, fontWeight: '800', tracking: 2 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 16, lineHeight: 38 },
  heroBody: { color: '#ffffffdd', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  subscribeBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99 },
  subscribeBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  heroImageContainer: { position: 'absolute', right: -40, bottom: -20, width: 140, height: 140, transform: [{rotate: '8deg'}] },
  heroImage: { width: '100%', height: '100%', borderRadius: 20 },
  sectionHeader: { marginBottom: 20, marginTop: 16 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  sectionSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  categoryScroll: { gap: 16, paddingBottom: 16 },
  categoryCard: { width: 140, height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.surfaceContainerLow },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.3)' },
  categoryName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bentoLargeCard: {
    backgroundColor: COLORS.surfaceContainerLowest, padding: 20, borderRadius: 32,
    shadowColor: COLORS.primary, shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.1, shadowRadius: 24, elevation: 4,
  },
  bentoBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, marginBottom: 8 },
  bentoBadgeText: { color: '#005312', fontSize: 10, fontWeight: '800', tracking: 1 },
  bentoTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  kcalText: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  bentoImage: { width: '100%', height: 200, borderRadius: 20, marginTop: 16, marginBottom: 20 },
  addToTrayBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: COLORS.primaryContainer, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99, gap: 8 },
  addToTrayText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  addToTrayIcon: { color: '#fff', fontWeight: '800', fontSize: 18 },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: COLORS.primary, shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.3, shadowRadius: 10 },
  fabBadge: { position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  fabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' }
});
