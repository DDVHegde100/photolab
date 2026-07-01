import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { FILTER_PRESETS, PRESET_PACKS } from '../../assets/presets';
import { colors, spacing, typography, radius } from '../../ui/theme';

export function FiltersPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setActiveFilter = useEditorStore((s) => s.setActiveFilter);
  const setFilterIntensity = useEditorStore((s) => s.setFilterIntensity);
  const [activePack, setActivePack] = useState('cinematic');

  if (!recipe) return null;

  const packPresets = FILTER_PRESETS.filter(
    (p) => p.category.toLowerCase() === activePack.toLowerCase()
  );

  return (
    <ScrollPanel>
      <PanelHeader title="Filters" subtitle="Non-destructive color looks" />

      <Slider
        label="Intensity"
        value={recipe.filterIntensity}
        min={0}
        max={1}
        onChange={setFilterIntensity}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.packScroll}
        contentContainerStyle={styles.packRow}
      >
        {PRESET_PACKS.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            style={[styles.packChip, activePack === pack.id && styles.packChipActive]}
            onPress={() => setActivePack(pack.id)}
          >
            <Text style={styles.packIcon}>{pack.icon}</Text>
            <Text style={[styles.packText, activePack === pack.id && styles.packTextActive]}>
              {pack.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.presetList}>
        <TouchableOpacity
          style={[styles.presetRow, !recipe.activeFilter && styles.presetRowActive]}
          onPress={() => setActiveFilter(null)}
        >
          <Text style={styles.presetName}>None</Text>
          {!recipe.activeFilter && <Text style={styles.activeBadge}>Active</Text>}
        </TouchableOpacity>

        {packPresets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetRow,
              recipe.activeFilter === preset.id && styles.presetRowActive,
            ]}
            onPress={() => setActiveFilter(preset.id)}
          >
            <View>
              <Text style={styles.presetName}>{preset.name}</Text>
              <Text style={styles.presetCategory}>{preset.category}</Text>
            </View>
            {recipe.activeFilter === preset.id && (
              <Text style={styles.activeBadge}>Active</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  packScroll: { marginVertical: spacing.sm },
  packRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  packChip: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    minWidth: 72,
  },
  packChipActive: {
    backgroundColor: colors.accentGlow,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  packIcon: { fontSize: 20, marginBottom: 4 },
  packText: { ...typography.micro, color: colors.textTertiary },
  packTextActive: { color: colors.accentLight },
  presetList: { paddingHorizontal: spacing.lg },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderRadius: radius.sm,
  },
  presetRowActive: {
    backgroundColor: colors.accentGlow,
    paddingHorizontal: spacing.md,
    marginHorizontal: -spacing.md,
  },
  presetName: { ...typography.body, color: colors.textPrimary },
  presetCategory: { ...typography.micro, color: colors.textTertiary, marginTop: 2 },
  activeBadge: { ...typography.micro, color: colors.accentLight, fontWeight: '600' },
});
