import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { spacing } from '../../ui/theme';

export function SplitTonePanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setSplitTone = useEditorStore((s) => s.setSplitTone);

  if (!recipe) return null;

  const update = (key: keyof typeof recipe.splitTone, value: number) => {
    setSplitTone({ ...recipe.splitTone, [key]: value });
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Split Tone" subtitle="Tint shadows and highlights separately" />
      <View style={styles.body}>
        <Slider
          label="Shadow Hue"
          value={recipe.splitTone.shadowHue}
          min={0}
          max={360}
          onChange={(v) => update('shadowHue', v)}
        />
        <Slider
          label="Shadow Saturation"
          value={recipe.splitTone.shadowSaturation}
          min={0}
          max={100}
          onChange={(v) => update('shadowSaturation', v)}
        />
        <Slider
          label="Highlight Hue"
          value={recipe.splitTone.highlightHue}
          min={0}
          max={360}
          onChange={(v) => update('highlightHue', v)}
        />
        <Slider
          label="Highlight Saturation"
          value={recipe.splitTone.highlightSaturation}
          min={0}
          max={100}
          onChange={(v) => update('highlightSaturation', v)}
        />
        <Slider
          label="Balance"
          value={recipe.splitTone.balance}
          min={-100}
          max={100}
          onChange={(v) => update('balance', v)}
        />
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
