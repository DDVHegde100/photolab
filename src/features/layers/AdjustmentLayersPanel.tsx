import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { colors, spacing, typography, radius } from '../../ui/theme';

const LAYER_PRESETS = [
  { name: 'Brighten', adjustments: { exposure: 0.3, shadows: 0.2 } },
  { name: 'Moody', adjustments: { exposure: -0.15, contrast: 0.2, saturation: -0.15 } },
  { name: 'Warm Pop', adjustments: { temperature: 20, vibrance: 0.2 } },
  { name: 'Cool Fade', adjustments: { temperature: -18, contrast: -0.1, blacks: 0.1 } },
];

export function AdjustmentLayersPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const addAdjustmentLayer = useEditorStore((s) => s.addAdjustmentLayer);
  const updateAdjustmentLayer = useEditorStore((s) => s.updateAdjustmentLayer);
  const removeAdjustmentLayer = useEditorStore((s) => s.removeAdjustmentLayer);
  const toggleAdjustmentLayer = useEditorStore((s) => s.toggleAdjustmentLayer);

  if (!recipe) return null;

  const addPreset = (preset: (typeof LAYER_PRESETS)[0]) => {
    addAdjustmentLayer({
      id: uuidv4(),
      name: preset.name,
      adjustments: preset.adjustments,
      visible: true,
      opacity: 0.85,
    });
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Adjust Layers" subtitle="Stack non-destructive looks" />

      <View style={styles.body}>
        {recipe.adjustmentLayers.length === 0 ? (
          <Text style={styles.empty}>No layers yet. Add a preset below.</Text>
        ) : (
          recipe.adjustmentLayers.map((layer) => (
            <View key={layer.id} style={styles.layerRow}>
              <TouchableOpacity onPress={() => toggleAdjustmentLayer(layer.id)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{layer.visible ? '👁' : '—'}</Text>
              </TouchableOpacity>
              <View style={styles.layerInfo}>
                <Text style={styles.layerName}>{layer.name}</Text>
                <Slider
                  label="Opacity"
                  value={layer.opacity}
                  min={0}
                  max={1}
                  onChange={(v) => updateAdjustmentLayer(layer.id, { opacity: v })}
                />
              </View>
              <TouchableOpacity onPress={() => removeAdjustmentLayer(layer.id)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Add Layer</Text>
        <View style={styles.presetRow}>
          {LAYER_PRESETS.map((p) => (
            <TouchableOpacity key={p.name} style={styles.presetBtn} onPress={() => addPreset(p)}>
              <Text style={styles.presetText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  empty: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.lg },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  eyeBtn: { paddingTop: spacing.sm },
  eyeIcon: { fontSize: 18 },
  layerInfo: { flex: 1 },
  layerName: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.xs },
  remove: { color: colors.danger, fontSize: 16, padding: spacing.sm },
  sectionTitle: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: { ...typography.caption, color: colors.textSecondary },
});
