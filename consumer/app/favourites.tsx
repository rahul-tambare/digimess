import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Star, Trash2 } from 'lucide-react-native';
import { favoriteApi } from '@/services/api';

interface FavMess {
  id: string;
  messId: string;
  name?: string;
  messName?: string;
  rating?: number;
  type?: string;
}

export default function FavouritesScreen() {
  const router = useRouter();
  const [favourites, setFavourites] = useState<FavMess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await favoriteApi.getFavorites();
      const data = Array.isArray(res) ? res : (res.favorites || res.data || []);
      setFavourites(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load favourites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFavourites(); }, [fetchFavourites]);

  const handleRemove = (messId: string) => {
    Alert.alert('Remove Favourite', 'Remove this mess from your favourites?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await favoriteApi.removeFavorite(messId);
            setFavourites(prev => prev.filter(f => (f.messId || f.id) !== messId));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to remove favourite');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FavMess }) => {
    const messId = item.messId || item.id;
    const messName = item.messName || item.name || 'Unknown Mess';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/mess/${messId}`)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <Heart size={22} color="#FF6B35" fill="#FF6B35" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.messName}>{messName}</Text>
          <View style={styles.metaRow}>
            {item.type && <Text style={styles.metaText}>{item.type}</Text>}
            {item.rating != null && (
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(messId)} activeOpacity={0.7}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favourite Messes</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : favourites.length === 0 ? (
        <View style={styles.center}>
          <Heart size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Favourites Yet</Text>
          <Text style={styles.emptySubtitle}>Explore messes and tap the heart icon to save your favourites here.</Text>
        </View>
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  messName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  removeBtn: { padding: 10, borderRadius: 12, backgroundColor: '#FEF2F2' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
});
