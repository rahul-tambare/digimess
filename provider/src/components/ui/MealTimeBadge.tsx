// ==========================================
// MealTimeBadge — Breakfast/Lunch/Dinner chip
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, FontWeights, BorderRadius, Spacing } from '../../constants/theme';

interface MealTimeBadgeProps {
  mealTime: string;
  size?: 'sm' | 'md';
}

const mealConfig: Record<string, { emoji: string; color: string; bg: string }> = {
  Breakfast: { emoji: '🌅', color: Colors.breakfast, bg: '#FFF7ED' },
  breakfast: { emoji: '🌅', color: Colors.breakfast, bg: '#FFF7ED' },
  Lunch: { emoji: '☀️', color: Colors.lunch, bg: '#FEFCE8' },
  lunch: { emoji: '☀️', color: Colors.lunch, bg: '#FEFCE8' },
  Dinner: { emoji: '🌙', color: Colors.dinner, bg: '#F5F3FF' },
  dinner: { emoji: '🌙', color: Colors.dinner, bg: '#F5F3FF' },
  'All Day': { emoji: '🍽️', color: Colors.textSecondary, bg: Colors.background },
};

export default function MealTimeBadge({ mealTime, size = 'md' }: MealTimeBadgeProps) {
  const config = mealConfig[mealTime] || mealConfig['All Day'];
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSm && styles.badgeSm]}>
      <Text style={isSm ? styles.emojiSm : styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.text, { color: config.color }, isSm && styles.textSm]}>{mealTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  emoji: {
    fontSize: 14,
  },
  emojiSm: {
    fontSize: 11,
  },
  text: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  textSm: {
    fontSize: FontSizes.xs,
  },
});
