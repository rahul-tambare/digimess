// ==========================================
// ToggleSwitch — Styled toggle with label
// ==========================================

import React from 'react';
import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights } from '../../constants/theme';

interface ToggleSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ label, value, onValueChange, description, disabled }: ToggleSwitchProps) {
  return (
    <Pressable style={styles.container} onPress={() => !disabled && onValueChange(!value)} disabled={disabled}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E2E8F0', true: Colors.primaryBg2 }}
        thumbColor={value ? Colors.primary : '#CBD5E1'}
        ios_backgroundColor="#E2E8F0"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  labelDisabled: {
    color: Colors.textTertiary,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
