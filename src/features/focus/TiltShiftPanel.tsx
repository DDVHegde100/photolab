import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { colors, spacing, typography, radius } from '../../ui/theme';

export function TiltShiftPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setTiltShift = useEditorStore((s) => s.setTiltShift);

  if (!recipe) return null;

  const update = (patch: Partial<typeof recipe.tiltShift>) => {
    setTiltShift({ ...recipe.tiltShift, ...patch });
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Tilt-Shift" subtitle="Radial focus blur effect" />
      <View style={styles.body}>
        <TouchableOpacity
          style={[styles.toggle, recipe.tiltShift.enabled && styles.toggleActive]}
          onPress={() => update({ enabled: !recipe.tiltShift.enabled })}
        >
          <Text style={styles.toggleText}>
            {recipe.tiltShift.enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </TouchableOpacity>

        <Slider
          label="Focus Position"
          value={recipe.tiltShift.centerY}
          min={0}
          max={1}
          onChange={(v) => update({ centerY: v })}
        />
        <Slider
          label="Focus Band"
          value={recipe.tiltShift.bandSize}
          min={0.05}
          max={0.6}
          onChange={(v) => update({ bandSize: v })}
        />
        <Slider
          label="Blur Strength"
          value={recipe.tiltShift.blurAmount}
          min={0}
          max={1}
          onChange={(v) => update({ blurAmount: v, enabled: v > 0 ? true : recipe.tiltShift.enabled })}
        />
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  toggle: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.lg,
  },
  toggleActive: { backgroundColor: colors.accentGlow, borderWidth: 1, borderColor: colors.accent },
  toggleText: { ...typography.subtitle, color: colors.textPrimary },
});
