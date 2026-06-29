import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { EnhancementPaintType } from '../../core/types';

const TOOLS = [
  { id: 'brush' as const, label: 'Brush', icon: '🖌️' },
  { id: 'pencil' as const, label: 'Pencil', icon: '✏️' },
  { id: 'eraser' as const, label: 'Eraser', icon: '🧹' },
  { id: 'enhancement' as const, label: 'Enhance', icon: '✨' },
];

const ENHANCEMENTS: { id: EnhancementPaintType; label: string }[] = [
  { id: 'contour', label: 'Contour' },
  { id: 'muscle', label: 'Muscle' },
  { id: 'beard', label: 'Beard' },
  { id: 'skin-smooth', label: 'Skin Smooth' },
  { id: 'sharpen', label: 'Sharpen' },
];

const COLORS = ['#FFFFFF', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#000000'];

export function BrushPanel() {
  const brushSettings = useEditorStore((s) => s.brushSettings);
  const setBrushSettings = useEditorStore((s) => s.setBrushSettings);
  const recipe = useEditorStore((s) => s.recipe);
  const addDrawingLayer = useEditorStore((s) => s.addDrawingLayer);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  if (!recipe) return null;

  const ensureLayer = () => {
    if (activeLayer) return activeLayer;
    const id = uuidv4();
    addDrawingLayer({
      id,
      name: `Layer ${recipe.drawingLayers.length + 1}`,
      strokes: [],
      visible: true,
      opacity: 1,
      blendMode: 'soft-light',
    });
    setActiveLayer(id);
    return id;
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolRow}>
        {TOOLS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.toolBtn, brushSettings.tool === t.id && styles.toolBtnActive]}
            onPress={() => {
              setBrushSettings({ tool: t.id });
              ensureLayer();
            }}
          >
            <Text style={styles.toolIcon}>{t.icon}</Text>
            <Text style={[styles.toolLabel, brushSettings.tool === t.id && styles.toolLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Slider
        label="Size"
        value={brushSettings.size}
        min={1}
        max={100}
        onChange={(v) => setBrushSettings({ size: v })}
      />
      <Slider
        label="Opacity"
        value={brushSettings.opacity}
        min={0.05}
        max={1}
        onChange={(v) => setBrushSettings({ opacity: v })}
      />
      <Slider
        label="Hardness"
        value={brushSettings.hardness}
        min={0}
        max={1}
        onChange={(v) => setBrushSettings({ hardness: v })}
      />

      {brushSettings.tool === 'enhancement' && (
        <View>
          <Text style={styles.sectionTitle}>Enhancement Type</Text>
          <View style={styles.enhanceRow}>
            {ENHANCEMENTS.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.enhanceChip,
                  brushSettings.enhancementType === e.id && styles.enhanceChipActive,
                ]}
                onPress={() => setBrushSettings({ enhancementType: e.id })}
              >
                <Text
                  style={[
                    styles.enhanceText,
                    brushSettings.enhancementType === e.id && styles.enhanceTextActive,
                  ]}
                >
                  {e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {brushSettings.tool !== 'enhancement' && (
        <View>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  brushSettings.color === c && styles.colorSwatchActive,
                ]}
                onPress={() => setBrushSettings({ color: c })}
              />
            ))}
          </View>
        </View>
      )}

      <Text style={styles.hint}>
        Draw on the canvas to paint. Enhancement mode uses low-opacity soft-light blending.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 360,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  toolBtn: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  toolBtnActive: {
    backgroundColor: colors.accentGlow,
  },
  toolIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  toolLabel: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  toolLabelActive: {
    color: colors.accentLight,
  },
  sectionTitle: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  enhanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  enhanceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  enhanceChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  enhanceText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  enhanceTextActive: {
    color: colors.accentLight,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
