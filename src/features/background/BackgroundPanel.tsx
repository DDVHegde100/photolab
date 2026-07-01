import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { pickImageFromLibrary } from '../../platform/pickImage';
import { imageProcessor } from '../../processing';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { BackgroundLayer, BackgroundType } from '../../core/types';

const BG_COLORS = [
  '#FFFFFF',
  '#F5F5F5',
  '#1A1A2E',
  '#16213E',
  '#0F3460',
  '#E94560',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#9B59B6',
];

const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
];

const MODES: { id: BackgroundType; label: string; icon: string }[] = [
  { id: 'blur', label: 'Blur', icon: '🌫' },
  { id: 'color', label: 'Color', icon: '🎨' },
  { id: 'gradient', label: 'Gradient', icon: '🌈' },
  { id: 'image', label: 'Photo', icon: '🖼' },
];

export function BackgroundPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const currentImage = useEditorStore((s) => s.currentImage);
  const applyEnhancement = useEditorStore((s) => s.applyEnhancement);
  const setBackground = useEditorStore((s) => s.setBackground);

  const [mode, setMode] = useState<BackgroundType>('blur');
  const [blurAmount, setBlurAmount] = useState(0.65);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [threshold, setThreshold] = useState(0.65);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!recipe || !currentImage) return null;

  const buildBackground = (): BackgroundLayer => {
    switch (mode) {
      case 'color':
        return { type: 'color', color: selectedColor, enabled: true };
      case 'gradient':
        return {
          type: 'gradient',
          gradientColors: GRADIENTS[selectedGradient],
          enabled: true,
        };
      case 'image':
        return { type: 'image', imageUri: undefined, enabled: true };
      default:
        return { type: 'blur', blurAmount, enabled: true };
    }
  };

  const runReplace = async (bg?: BackgroundLayer) => {
    setLoading(true);
    setStatus('Segmenting subject…');
    try {
      const background = bg ?? buildBackground();
      const sourceUri = recipe.workingUri ?? recipe.originalUri;
      const input = {
        uri: sourceUri,
        width: currentImage.width,
        height: currentImage.height,
      };

      const result = await imageProcessor.replaceBackground(
        input,
        background,
        threshold
      );

      setBackground({ ...background, maskUri: result.maskUri, enabled: true });
      applyEnhancement(
        { type: 'background', strength: threshold, appliedAt: Date.now() },
        result
      );
      setStatus('Background replaced');
    } catch (e) {
      setStatus(`Failed: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const pickBackgroundImage = async () => {
    const picked = await pickImageFromLibrary();
    if (!picked) return;
    await runReplace({ type: 'image', imageUri: picked.uri, enabled: true });
  };

  return (
    <ScrollPanel>
      <PanelHeader
        title="Background"
        subtitle="Auto-segment and replace"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeBtn, mode === m.id && styles.modeBtnActive]}
            onPress={() => setMode(m.id)}
          >
            <Text style={styles.modeIcon}>{m.icon}</Text>
            <Text style={[styles.modeLabel, mode === m.id && styles.modeLabelActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Slider
          label="Detection sensitivity"
          value={threshold}
          min={0.3}
          max={0.95}
          onChange={setThreshold}
        />

        {mode === 'blur' && (
          <Slider label="Blur strength" value={blurAmount} min={0.2} max={1} onChange={setBlurAmount} />
        )}

        {mode === 'color' && (
          <View style={styles.colorGrid}>
            {BG_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorSwatchActive,
                ]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>
        )}

        {mode === 'gradient' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GRADIENTS.map((g, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.gradientSwatch,
                  selectedGradient === i && styles.colorSwatchActive,
                ]}
                onPress={() => setSelectedGradient(i)}
              >
                <View style={[styles.gradientHalf, { backgroundColor: g[0] }]} />
                <View style={[styles.gradientHalf, { backgroundColor: g[1] }]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.actions}>
        {mode === 'image' ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={pickBackgroundImage} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Pick Background Photo</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => runReplace()} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Replace Background</Text>
            )}
          </TouchableOpacity>
        )}
        {status && <Text style={styles.status}>{status}</Text>}
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  modeBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    minWidth: 76,
  },
  modeBtnActive: {
    backgroundColor: colors.accentGlow,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  modeIcon: { fontSize: 22, marginBottom: 4 },
  modeLabel: { ...typography.micro, color: colors.textTertiary },
  modeLabelActive: { color: colors.accentLight },
  section: { paddingHorizontal: spacing.lg },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: colors.accentLight },
  gradientSwatch: {
    width: 56,
    height: 40,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientHalf: { flex: 1 },
  actions: { padding: spacing.lg },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.subtitle, color: colors.textPrimary, fontWeight: '600' },
  status: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
});
