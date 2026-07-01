import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { applySpotHeal } from '../../processing/spotHeal';
import { getDisplayUri } from '../../core/types';
import { colors, spacing, typography, radius } from '../../ui/theme';

interface HealPanelProps {
  tapMode: boolean;
  onTapModeChange: (enabled: boolean) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export function HealPanel({ tapMode, onTapModeChange, radius, onRadiusChange }: HealPanelProps) {
  const recipe = useEditorStore((s) => s.recipe);
  const currentImage = useEditorStore((s) => s.currentImage);
  const applyHealSpots = useEditorStore((s) => s.applyHealSpots);
  const [loading, setLoading] = useState(false);

  if (!recipe || !currentImage) return null;

  const pending = recipe.healSpots.filter((s) => !s.healed);

  const toggleTap = () => {
    onTapModeChange(!tapMode);
  };

  const applyAll = async () => {
    if (pending.length === 0) return;
    setLoading(true);
    try {
      const uri = getDisplayUri(recipe);
      const result = await applySpotHeal(uri, recipe.healSpots);
      applyHealSpots(result);
      onTapModeChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Spot Heal" subtitle="Tap blemishes to remove" />
      <View style={styles.body}>
        <Slider label="Brush Size" value={radius} min={0.005} max={0.06} onChange={onRadiusChange} />

        <TouchableOpacity
          style={[styles.tapBtn, tapMode && styles.tapBtnActive]}
          onPress={toggleTap}
        >
          <Text style={styles.tapBtnText}>
            {tapMode ? 'Tap on canvas…' : 'Start Tapping'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.count}>{pending.length} spot(s) marked</Text>

        {pending.length > 0 && (
          <TouchableOpacity style={styles.applyBtn} onPress={applyAll} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyText}>Apply Healing</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollPanel>
  );
}

export function createHealSpot(x: number, y: number, radius: number) {
  return { id: uuidv4(), x, y, radius, healed: false };
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  tapBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginVertical: spacing.md,
  },
  tapBtnActive: { backgroundColor: colors.accentGlow, borderWidth: 1, borderColor: colors.accent },
  tapBtnText: { ...typography.subtitle, color: colors.textPrimary },
  count: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
  applyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  applyText: { ...typography.subtitle, color: colors.textPrimary },
});
