import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Heart, MapPin, Clock, Star } from 'lucide-react-native';

export interface MessCardProps {
  id: string;
  name: string;
  type: 'veg' | 'non-veg' | 'both';
  coverImage: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  deliveryTimeMin: number;
  priceRange: { min: number; max: number };
  tags: string[];
  isOpen: boolean;
  hasSubscription: boolean;
  onPress: () => void;
}

export function MessCard({
  name, type, coverImage, rating, reviewCount, distanceKm,
  deliveryTimeMin, priceRange, tags, isOpen, hasSubscription, onPress,
}: MessCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      {/* Cover Image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: coverImage }} style={styles.image} resizeMode="cover" />
        
        <TouchableOpacity style={styles.heartBtn}>
          <Heart size={18} color="#666" />
        </TouchableOpacity>

        {hasSubscription && (
          <View style={styles.subBadge}>
            <Text style={styles.subBadgeText}>🔄 Subscription</Text>
          </View>
        )}

        {!isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>Currently Closed</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.messName} numberOfLines={1}>{name}</Text>
          <View style={[styles.vegDot, { backgroundColor: type === 'veg' ? '#22C55E' : '#EF4444' }]} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Star size={14} color="#EAB308" fill="#EAB308" />
            <Text style={styles.statBold}>{rating}</Text>
            <Text style={styles.statLight}>({reviewCount})</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.stat}>
            <Clock size={13} color="#94A3B8" />
            <Text style={styles.statText}>{deliveryTimeMin} min</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.stat}>
            <MapPin size={13} color="#94A3B8" />
            <Text style={styles.statText}>{distanceKm} km</Text>
          </View>
        </View>

        {/* Tags */}
        <Text style={styles.tags} numberOfLines={1}>{tags.join(' • ')}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{priceRange.min} – ₹{priceRange.max} per thali</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      default: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
    }),
  },
  imageWrap: {
    height: 180,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(30,41,59,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLight: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  tags: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 10,
  },
  priceRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
