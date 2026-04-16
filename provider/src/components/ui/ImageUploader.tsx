// ==========================================
// ImageUploader — Tap to select + preview
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/theme';

interface ImageUploaderProps {
  label: string;
  images: string[];
  maxImages?: number;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  required?: boolean;
}

export default function ImageUploader({ label, images, maxImages = 1, onAdd, onRemove, required }: ImageUploaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      <Text style={styles.hint}>Tap to upload • {images.length}/{maxImages} added</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {images.map((img, idx) => (
          <View key={idx} style={styles.imagePreview}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageEmoji}>🖼️</Text>
              <Text style={styles.imageName} numberOfLines={1}>{img || `Image ${idx + 1}`}</Text>
            </View>
            <Pressable style={styles.removeBtn} onPress={() => onRemove?.(idx)}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          </View>
        ))}

        {images.length < maxImages && (
          <Pressable style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add Photo</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    gap: Spacing.md,
  },
  imagePreview: {
    width: 120,
    height: 100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  imageEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  imageName: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: FontWeights.bold,
  },
  addButton: {
    width: 120,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 28,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  addText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
  },
});
