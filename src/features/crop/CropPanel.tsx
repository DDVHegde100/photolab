import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useEditorStore } from '../../core/store';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { CropData } from '../../core/types';

const ASPECT_RATIOS = [
  { label: 'Free', value: null, w: 0.85, h: 0.85 },
  { label: '1:1', value: '1:1', w: 0.75, h: 0.75 },
  { label: '4:3', value: '4:3', w: 0.9, h: 0.675 },
  { label: '3:2', value: '3:2', w: 0.9, h: 0.6 },
  { label: '16:9', value: '16:9', w: 0.95, h: 0.534 },
  { label: '9:16', value: '9:16', w: 0.56, h: 0.95 },
  { label: '4:5', value: '4:5', w: 0.72, h: 0.9 },
];

const ROTATIONS = [0, 90, 180, 270];

function buildCropRect(w: number, h: number, aspect: string | null): CropData {
  const preset = ASPECT_RATIOS.find((a) => a.value === aspect) ?? ASPECT_RATIOS[0];
  const cx = (1 - preset.w) / 2;
  const cy = (1 - preset.h) / 2;
  return {
    x: cx,
    y: cy,
    width: preset.w,
    height: preset.h,
    rotation: 0,
    aspectRatio: aspect,
  };
}

export function CropPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setCrop = useEditorStore((s) => s.setCrop);
  const [aspect, setAspect] = useState<string | null>(recipe?.crop?.aspectRatio ?? null);
  const [rotation, setRotation] = useState(recipe?.crop?.rotation ?? 0);

  if (!recipe) return null;

  const applyCrop = () => {
    const base = buildCropRect(1, 1, aspect);
    setCrop({ ...base, rotation, aspectRatio: aspect });
  };

  const resetCrop = () => setCrop(null);

  return (
    <ScrollPanel>
      <PanelHeader title="Crop" subtitle="Aspect ratio and rotation" />

      <View style={styles.body}>
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
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
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
