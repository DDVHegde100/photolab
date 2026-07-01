import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useEditorStore } from '../../core/store';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { colors, spacing, typography, radius } from '../../ui/theme';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  onToggle: () => void;
}

export function UnifiedLayersPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const toggleAdjustmentLayer = useEditorStore((s) => s.toggleAdjustmentLayer);
  const updateTextLayer = useEditorStore((s) => s.updateTextLayer);
  const updateOverlayLayer = useEditorStore((s) => s.updateOverlayLayer);
  const updateLocalEdit = useEditorStore((s) => s.updateLocalEdit);

  if (!recipe) return null;

  const items: LayerItem[] = [
    ...recipe.overlayLayers.map((l) => ({
      id: l.id,
      name: l.name,
      type: 'Overlay',
      visible: l.visible,
      onToggle: () => updateOverlayLayer(l.id, { visible: !l.visible }),
    })),
    ...recipe.textLayers.map((l) => ({
      id: l.id,
      name: l.text.slice(0, 20),
      type: 'Text',
      visible: l.visible,
      onToggle: () => updateTextLayer(l.id, { visible: !l.visible }),
    })),
    ...recipe.localEdits.map((l) => ({
      id: l.id,
      name: l.name,
      type: 'Selective',
      visible: l.visible,
      onToggle: () => updateLocalEdit(l.id, { visible: !l.visible }),
    })),
    ...recipe.adjustmentLayers.map((l) => ({
      id: l.id,
      name: l.name,
      type: 'Adjust',
      visible: l.visible,
      onToggle: () => toggleAdjustmentLayer(l.id),
    })),
    ...recipe.drawingLayers.map((l) => ({
      id: l.id,
      name: l.name,
      type: 'Draw',
      visible: l.visible,
      onToggle: () => {},
    })),
  ];

  return (
    <ScrollPanel>
      <PanelHeader title="Layers" subtitle="Visibility and stacking order" />
      <ScrollView style={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No layers yet. Add adjustments, text, or overlays.</Text>
        ) : (
          items.map((item, index) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.order}>{items.length - index}</Text>
              <TouchableOpacity onPress={item.onToggle} style={styles.eyeBtn}>
                <Text>{item.visible ? '👁' : '—'}</Text>
              </TouchableOpacity>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.type}>{item.type}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, maxHeight: 280 },
  empty: { ...typography.caption, color: colors.textTertiary, paddingVertical: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  order: { ...typography.micro, color: colors.textTertiary, width: 20 },
  eyeBtn: { width: 32, alignItems: 'center' },
  info: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary },
  type: { ...typography.micro, color: colors.textTertiary },
});
