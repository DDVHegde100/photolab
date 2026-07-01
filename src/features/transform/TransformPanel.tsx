import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { spacing } from '../../ui/theme';

export function TransformPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setPerspective = useEditorStore((s) => s.setPerspective);

  if (!recipe) return null;

  const update = (key: keyof typeof recipe.perspective, value: number) => {
    setPerspective({ ...recipe.perspective, [key]: value });
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Transform" subtitle="Perspective and keystone correction" />
      <View style={styles.body}>
        <Slider
          label="Horizontal Skew"
          value={recipe.perspective.horizontal}
          min={-1}
          max={1}
          onChange={(v) => update('horizontal', v)}
        />
        <Slider
          label="Vertical Skew"
          value={recipe.perspective.vertical}
          min={-1}
          max={1}
          onChange={(v) => update('vertical', v)}
        />
        <Slider
          label="Fine Rotation"
          value={recipe.perspective.rotation}
          min={-15}
          max={15}
          onChange={(v) => update('rotation', v)}
        />
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
