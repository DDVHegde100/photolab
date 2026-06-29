import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { listMaskPresets } from '../../processing/maskPresets';
import { colors, spacing, typography, radius } from '../../ui/theme';

export function MaskPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const addMask = useEditorStore((s) => s.addMask);
  const maskSettings = useEditorStore((s) => s.maskSettings);
  const setMaskSettings = useEditorStore((s) => s.setMaskSettings);

  if (!recipe) return null;

  const presets = listMaskPresets();

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    addMask({
      id: uuidv4(),
      type: preset.type,
      region: preset.region,
      strokes: [],
      inverted: preset.region.invert ?? false,
      opacity: maskSettings.opacity,
      feather: maskSettings.feather,
      overlayColor: maskSettings.overlayColor,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Selection</Text>
      <Text style={styles.hint}>
        Algorithmic region masks — refine with the brush tool on canvas
      </Text>
      <View style={styles.grid}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={styles.actionBtn}
            onPress={() => applyPreset(preset.id)}
          >
            <Text style={styles.actionIcon}>{preset.icon}</Text>
            <Text style={styles.actionLabel}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>Mask Settings</Text>
      <Slider
        label="Opacity"
        value={maskSettings.opacity}
        min={0}
        max={1}
        onChange={(v) => setMaskSettings({ opacity: v })}
      />
      <Slider
        label="Feather"
        value={maskSettings.feather}
        min={0}
        max={100}
        onChange={(v) => setMaskSettings({ feather: v })}
      />

      {recipe.masks.length > 0 && (
        <Text style={styles.maskCount}>{recipe.masks.length} mask(s) active</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 380,
  },
  title: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBtn: {
    width: '47%',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { fontSize: 24, marginBottom: spacing.sm },
  actionLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  maskCount: {
    ...typography.caption,
    color: colors.accentLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
