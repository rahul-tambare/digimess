// ==========================================
// StepperHeader — Progress bar + back button
// ==========================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/theme';

interface StepperHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  onBack?: () => void;
  showBack?: boolean;
}

export default function StepperHeader({ currentStep, totalSteps, stepTitle, onBack, showBack = true }: StepperHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack && currentStep > 1 ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : <View style={styles.backPlaceholder} />}
        <Text style={styles.stepCount}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <Text style={styles.stepTitle}>{stepTitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.semibold,
  },
  backPlaceholder: {
    width: 60,
  },
  stepCount: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  stepTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
});
