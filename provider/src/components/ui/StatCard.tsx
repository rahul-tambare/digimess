// ==========================================
// StatCard — Metric display
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'dark' | 'primary';
}

export default function StatCard({ label, value, icon, trend, trendValue, variant = 'default' }: StatCardProps) {
  const isDark = variant === 'dark';
  const isPrimary = variant === 'primary';

  return (
    <View style={[
      styles.card,
      isDark && styles.cardDark,
      isPrimary && styles.cardPrimary,
    ]}>
      <View style={styles.topRow}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        {trend && trendValue && (
          <View style={[styles.trendBadge, trend === 'up' ? styles.trendUp : styles.trendDown]}>
            <Text style={[styles.trendText, trend === 'up' ? styles.trendTextUp : styles.trendTextDown]}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, isDark && styles.valueDark, isPrimary && styles.valuePrimary]}>{value}</Text>
      <Text style={[styles.label, isDark && styles.labelDark, isPrimary && styles.labelPrimary]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardDark: {
    backgroundColor: Colors.darkSurfaceLight,
    borderColor: 'transparent',
  },
  cardPrimary: {
    backgroundColor: Colors.primary,
    borderColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  trendBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trendUp: {
    backgroundColor: Colors.successBg,
  },
  trendDown: {
    backgroundColor: Colors.errorBg,
  },
  trendText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  trendTextUp: {
    color: Colors.success,
  },
  trendTextDown: {
    color: Colors.error,
  },
  value: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  valueDark: {
    color: Colors.textInverse,
  },
  valuePrimary: {
    color: Colors.textInverse,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelDark: {
    color: Colors.darkTextSecondary,
  },
  labelPrimary: {
    color: 'rgba(255,255,255,0.8)',
  },
});
