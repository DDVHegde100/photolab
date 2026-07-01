import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { pickImageFromLibrary } from '../../platform/pickImage';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { OverlayImageLayer } from '../../core/types';

const BLEND_MODES: OverlayImageLayer['blendMode'][] = [
  'normal',
  'multiply',
  'overlay',
  'soft-light',
];

export function OverlayPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const addOverlayLayer = useEditorStore((s) => s.addOverlayLayer);
  const updateOverlayLayer = useEditorStore((s) => s.updateOverlayLayer);
  const removeOverlayLayer = useEditorStore((s) => s.removeOverlayLayer);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!recipe) return null;

  const selected = recipe.overlayLayers.find((l) => l.id === selectedId);

  const pickOverlay = async () => {
    const picked = await pickImageFromLibrary();
    if (!picked) return;
    const layer: OverlayImageLayer = {
      id: uuidv4(),
      name: 'Overlay',
      uri: picked.uri,
      opacity: 0.5,
      visible: true,
      blendMode: 'overlay',
    };
    addOverlayLayer(layer);
    setSelectedId(layer.id);
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Overlay" subtitle="Double exposure and blend modes" />
      <View style={styles.body}>
        <TouchableOpacity style={styles.pickBtn} onPress={pickOverlay}>
          <Text style={styles.pickText}>+ Add Overlay Image</Text>
        </TouchableOpacity>

        {selected && (
          <>
            <Slider
              label="Opacity"
              value={selected.opacity}
              min={0}
              max={1}
              onChange={(v) => updateOverlayLayer(selected.id, { opacity: v })}
            />
            <View style={styles.blendRow}>
              {BLEND_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.blendBtn, selected.blendMode === mode && styles.blendBtnActive]}
                  onPress={() => updateOverlayLayer(selected.id, { blendMode: mode })}
                >
                  <Text style={styles.blendText}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {recipe.overlayLayers.map((layer) => (
          <TouchableOpacity
            key={layer.id}
            style={[styles.layerRow, selectedId === layer.id && styles.layerRowActive]}
            onPress={() => setSelectedId(layer.id)}
            onLongPress={() => removeOverlayLayer(layer.id)}
          >
            <Text style={styles.layerName}>{layer.name}</Text>
            <Text style={styles.layerMeta}>{Math.round(layer.opacity * 100)}% · {layer.blendMode}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  pickBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pickText: { ...typography.subtitle, color: colors.textPrimary },
  blendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  blendBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  blendBtnActive: { backgroundColor: colors.accentGlow, borderWidth: 1, borderColor: colors.accent },
  blendText: { ...typography.micro, color: colors.textSecondary, textTransform: 'capitalize' },
  layerRow: {
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.xs,
  },
  layerRowActive: { backgroundColor: colors.accentGlow },
  layerName: { ...typography.body, color: colors.textPrimary },
  layerMeta: { ...typography.micro, color: colors.textTertiary },
});
