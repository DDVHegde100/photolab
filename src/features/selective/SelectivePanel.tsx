import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { LocalEditType } from '../../core/types';

const EDIT_TYPES: { id: LocalEditType; label: string; icon: string }[] = [
  { id: 'exposure', label: 'Exposure', icon: '☀️' },
  { id: 'contrast', label: 'Contrast', icon: '◐' },
  { id: 'saturation', label: 'Saturation', icon: '🎨' },
  { id: 'warmth', label: 'Warmth', icon: '🔥' },
];

export function SelectivePanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const addLocalEdit = useEditorStore((s) => s.addLocalEdit);
  const updateLocalEdit = useEditorStore((s) => s.updateLocalEdit);
  const setActiveLocalEditId = useEditorStore((s) => s.setActiveLocalEditId);
  const activeLocalEditId = useEditorStore((s) => s.activeLocalEditId);
  const [activeId, setActiveId] = useState<string | null>(activeLocalEditId);

  if (!recipe) return null;

  const active = recipe.localEdits.find((l) => l.id === activeId) ?? recipe.localEdits[0];

  const createLayer = (type: LocalEditType) => {
    const layer = {
      id: uuidv4(),
      name: EDIT_TYPES.find((t) => t.id === type)?.label ?? 'Local',
      editType: type,
      amount: 0.5,
      strokes: [],
      visible: true,
      opacity: 0.8,
    };
    addLocalEdit(layer);
    setActiveId(layer.id);
    setActiveLocalEditId(layer.id);
  };

  return (
    <ScrollPanel>
      <PanelHeader
        title="Selective"
        subtitle="Paint local adjustments on canvas"
      />
      <View style={styles.body}>
        <View style={styles.typeRow}>
          {EDIT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeBtn, active?.editType === t.id && styles.typeBtnActive]}
              onPress={() => {
                const existing = recipe.localEdits.find((l) => l.editType === t.id);
                if (existing) {
                  setActiveId(existing.id);
                  setActiveLocalEditId(existing.id);
                } else createLayer(t.id);
              }}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={styles.typeLabel}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {active && (
          <>
            <Slider
              label="Strength"
              value={active.amount}
              min={0}
              max={1}
              onChange={(v) => updateLocalEdit(active.id, { amount: v })}
            />
            <Text style={styles.hint}>
              {active.strokes.length} stroke(s) · paint on the canvas
            </Text>
          </>
        )}

        {!active && (
          <Text style={styles.hint}>Pick an adjustment type to start painting</Text>
        )}
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    minWidth: 72,
  },
  typeBtnActive: { backgroundColor: colors.accentGlow, borderWidth: 1, borderColor: colors.accent },
  typeIcon: { fontSize: 20, marginBottom: 4 },
  typeLabel: { ...typography.micro, color: colors.textTertiary },
  hint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm },
});

export function getActiveLocalEditId(): string | null {
  return null;
}
