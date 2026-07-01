import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { spacing } from '../../ui/theme';

export function EffectsPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const setFinishing = useEditorStore((s) => s.setFinishing);

  if (!recipe) return null;

  const update = (key: keyof typeof recipe.finishing, value: number) => {
    setFinishing({ ...recipe.finishing, [key]: value });
  };

  return (
    <ScrollPanel>
      <PanelHeader title="Effects" subtitle="Vignette, grain, and fade" />
      <View style={styles.body}>
        <Slider
          label="Vignette"
          value={recipe.finishing.vignetteAmount}
          min={0}
          max={1}
          onChange={(v) => update('vignetteAmount', v)}
        />
        <Slider
          label="Vignette Shape"
          value={recipe.finishing.vignetteRoundness}
          min={0}
          max={1}
          onChange={(v) => update('vignetteRoundness', v)}
        />
        <Slider
          label="Film Grain"
          value={recipe.finishing.grainAmount}
          min={0}
          max={1}
          onChange={(v) => update('grainAmount', v)}
        />
        <Slider
          label="Matte Fade"
          value={recipe.finishing.fadeAmount}
          min={0}
          max={1}
          onChange={(v) => update('fadeAmount', v)}
        />
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
