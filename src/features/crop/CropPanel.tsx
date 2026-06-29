import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useEditorStore } from '../../core/store';
import { colors, spacing, typography, radius } from '../../ui/theme';

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:2', value: '3:2' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
];

const ROTATIONS = [0, 90, 180, 270];

export function CropPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setCrop = useEditorStore((s) => s.setCrop);
  const [aspect, setAspect] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  if (!recipe) return null;

  const applyCrop = () => {
    setCrop({
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
      rotation,
      aspectRatio: aspect,
    });
  };

  const resetCrop = () => setCrop(null);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Aspect Ratio</Text>
      <View style={styles.row}>
        {ASPECT_RATIOS.map((ar) => (
          <TouchableOpacity
            key={ar.label}
            style={[styles.chip, aspect === ar.value && styles.chipActive]}
            onPress={() => setAspect(ar.value)}
          >
            <Text style={[styles.chipText, aspect === ar.value && styles.chipTextActive]}>
              {ar.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Rotation</Text>
      <View style={styles.row}>
        {ROTATIONS.map((deg) => (
          <TouchableOpacity
            key={deg}
            style={[styles.chip, rotation === deg && styles.chipActive]}
            onPress={() => setRotation(deg)}
          >
            <Text style={[styles.chipText, rotation === deg && styles.chipTextActive]}>
              {deg}°
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetCrop}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={applyCrop}>
          <Text style={styles.applyText}>Apply Crop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectionTitle: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accentLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  applyText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});
