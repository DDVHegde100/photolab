import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { colors, spacing, typography, radius } from '../../ui/theme';

const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF453A', '#FFD60A', '#30D158', '#0A84FF', '#BF5AF2'];

export function TextPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const addTextLayer = useEditorStore((s) => s.addTextLayer);
  const updateTextLayer = useEditorStore((s) => s.updateTextLayer);
  const removeTextLayer = useEditorStore((s) => s.removeTextLayer);
  const [draft, setDraft] = useState('Your text');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!recipe) return null;

  const selected = recipe.textLayers.find((l) => l.id === selectedId);

  const addText = () => {
    const layer = {
      id: uuidv4(),
      text: draft || 'Text',
      x: 0.5,
      y: 0.5,
      fontSize: 32,
      color: '#FFFFFF',
      rotation: 0,
      opacity: 1,
      visible: true,
      fontWeight: 'bold' as const,
    };
    addTextLayer(layer);
    setSelectedId(layer.id);
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Text" subtitle="Add styled text overlays" />
      <View style={styles.body}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Enter text..."
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addText}>
          <Text style={styles.addBtnText}>Add Text Layer</Text>
        </TouchableOpacity>

        {selected && (
          <>
            <Slider
              label="Size"
              value={selected.fontSize / 72}
              min={0.2}
              max={1}
              onChange={(v) => updateTextLayer(selected.id, { fontSize: Math.round(v * 72) })}
            />
            <Slider
              label="Opacity"
              value={selected.opacity}
              min={0}
              max={1}
              onChange={(v) => updateTextLayer(selected.id, { opacity: v })}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {TEXT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, selected.color === c && styles.colorActive]}
                  onPress={() => updateTextLayer(selected.id, { color: c })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {recipe.textLayers.map((layer) => (
          <TouchableOpacity
            key={layer.id}
            style={[styles.layerChip, selectedId === layer.id && styles.layerChipActive]}
            onPress={() => setSelectedId(layer.id)}
            onLongPress={() => removeTextLayer(layer.id)}
          >
            <Text style={styles.layerChipText} numberOfLines={1}>{layer.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    marginBottom: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addBtnText: { ...typography.subtitle, color: colors.textPrimary },
  colorRow: { marginVertical: spacing.sm },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorActive: { borderColor: colors.accentLight },
  layerChip: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.xs,
  },
  layerChipActive: { backgroundColor: colors.accentGlow },
  layerChipText: { ...typography.caption, color: colors.textPrimary },
});
