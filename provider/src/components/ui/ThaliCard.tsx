// ==========================================
// ThaliCard — Thali/combo display card
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import type { Thali } from '../../types';
import MealTimeBadge from './MealTimeBadge';

interface ThaliCardProps {
  thali: Thali;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleAvailability?: () => void;
  onToggleSpecial?: () => void;
}

export default function ThaliCard({ thali, onEdit, onDelete, onToggleAvailability, onToggleSpecial }: ThaliCardProps) {
  return (
    <View style={[styles.card, !thali.isAvailable && styles.cardDisabled]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.vegDot, { backgroundColor: thali.type === 'Non-Veg' ? Colors.nonVeg : Colors.veg }]} />
          <Text style={styles.name} numberOfLines={1}>{thali.name}</Text>
        </View>
        {thali.isSpecial && (
          <View style={styles.specialBadge}>
            <Text style={styles.specialText}>⭐ Special</Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <MealTimeBadge mealTime={thali.mealTime} />
        <Text style={styles.itemCount}>{thali.numberOfItems || '—'} items</Text>
      </View>

      <Text style={styles.items} numberOfLines={2}>{thali.itemsIncluded}</Text>

      <View style={styles.priceRow}>
        <View style={styles.priceContainer}>
          {thali.discountedPrice ? (
            <>
              <Text style={styles.price}>₹{thali.discountedPrice}</Text>
              <Text style={styles.originalPrice}>₹{thali.price}</Text>
            </>
          ) : (
            <Text style={styles.price}>₹{thali.price}</Text>
          )}
        </View>
        {thali.maxQtyPerDay && (
          <Text style={styles.qty}>Max: {thali.maxQtyPerDay}/day</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{thali.isAvailable ? 'Available' : 'Unavailable'}</Text>
          <Switch
            value={thali.isAvailable}
            onValueChange={onToggleAvailability}
            trackColor={{ false: '#E2E8F0', true: Colors.successBg }}
            thumbColor={thali.isAvailable ? Colors.success : '#CBD5E1'}
          />
        </View>
        <View style={styles.actions}>
          {onToggleSpecial && (
            <Pressable style={styles.actionBtn} onPress={onToggleSpecial}>
              <Text style={styles.actionText}>{thali.isSpecial ? '★' : '☆'}</Text>
            </Pressable>
          )}
          {onEdit && (
            <Pressable style={styles.actionBtn} onPress={onEdit}>
              <Text style={styles.actionText}>✏️</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
              <Text style={styles.actionText}>🗑️</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  vegDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  name: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  specialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  specialText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: '#92400E',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemCount: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
  },
  items: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extrabold,
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: FontSizes.md,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  qty: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.errorBg,
  },
  actionText: {
    fontSize: 16,
  },
});
