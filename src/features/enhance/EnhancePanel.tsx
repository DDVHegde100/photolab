import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { imageProcessor } from '../../processing';
import { colors, spacing, typography, radius } from '../../ui/theme';

const ENHANCE_TOOLS = [
  {
    id: 'upscale',
    label: 'Super Resolution',
    description: 'Progressive upscale with natural sharpening',
    icon: '🔍',
  },
  {
    id: 'denoise',
    label: 'Noise Reduction',
    description: 'Edge-preserving smooth',
    icon: '🧊',
  },
  {
    id: 'portrait',
    label: 'Portrait Polish',
    description: 'Skin smooth + detail recovery',
    icon: '✨',
  },
  {
    id: 'lowlight',
    label: 'Shadow Recovery',
    description: 'Lift dark areas naturally',
    icon: '🌙',
  },
  {
    id: 'autocolor',
    label: 'Auto Color',
    description: 'White balance correction',
    icon: '🎨',
  },
];

export function EnhancePanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const currentImage = useEditorStore((s) => s.currentImage);
  const applyEnhancement = useEditorStore((s) => s.applyEnhancement);
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4 | 8>(2);
  const [strength, setStrength] = useState(0.7);

  if (!recipe || !currentImage) return null;

  const sourceUri = recipe.workingUri ?? recipe.originalUri;
  const input = {
    uri: sourceUri,
    width: currentImage.width || 1000,
    height: currentImage.height || 1000,
  };

  const runEnhance = async (toolId: string) => {
    setLoading(toolId);
    setProgress(null);
    try {
      let result;

      switch (toolId) {
        case 'upscale':
          result = await imageProcessor.upscale(input, {
            upscaleFactor,
            strength,
            onProgress: (step, total) => setProgress(`${step}/${total}`),
          });
          applyEnhancement(
            { type: 'upscale', factor: upscaleFactor, strength, appliedAt: Date.now() },
            result
          );
          break;
        case 'denoise':
          result = await imageProcessor.denoise(input, strength);
          applyEnhancement({ type: 'denoise', strength, appliedAt: Date.now() }, result);
          break;
        case 'portrait':
          result = await imageProcessor.portraitEnhance(input, strength);
          applyEnhancement({ type: 'portrait', strength, appliedAt: Date.now() }, result);
          break;
        case 'lowlight':
          result = await imageProcessor.lowLightRecovery(input, strength);
          applyEnhancement({ type: 'lowlight', strength, appliedAt: Date.now() }, result);
          break;
        case 'autocolor':
          result = await imageProcessor.autoColor(input);
          applyEnhancement({ type: 'autocolor', strength: 1, appliedAt: Date.now() }, result);
          break;
      }
    } finally {
      setLoading(null);
      setProgress(null);
    }
  };

  return (
    <View style={styles.container}>
      <Slider label="Strength" value={strength} min={0} max={1} onChange={setStrength} />

      {ENHANCE_TOOLS.map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={styles.toolRow}
          onPress={() => runEnhance(tool.id)}
          disabled={loading !== null}
        >
          <Text style={styles.toolIcon}>{tool.icon}</Text>
          <View style={styles.toolInfo}>
            <Text style={styles.toolLabel}>{tool.label}</Text>
            <Text style={styles.toolDesc}>{tool.description}</Text>
          </View>
          {loading === tool.id ? (
            <View style={styles.loadingWrap}>
              {progress && tool.id === 'upscale' && (
                <Text style={styles.progressText}>{progress}</Text>
              )}
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <Text style={styles.runBtn}>Apply</Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Upscale Factor</Text>
      <View style={styles.factorRow}>
        {([2, 4, 8] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.factorBtn, upscaleFactor === f && styles.factorBtnActive]}
            onPress={() => setUpscaleFactor(f)}
          >
            <Text style={[styles.factorText, upscaleFactor === f && styles.factorTextActive]}>
              {f}×
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {recipe.enhancements.length > 0 && (
        <Text style={styles.appliedCount}>
          {recipe.enhancements.length} enhancement(s) applied
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 420,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolIcon: { fontSize: 24, marginRight: spacing.md },
  toolInfo: { flex: 1 },
  toolLabel: { ...typography.subtitle, color: colors.textPrimary },
  toolDesc: { ...typography.caption, color: colors.textTertiary },
  runBtn: { ...typography.caption, color: colors.accentLight, fontWeight: '600' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressText: { ...typography.micro, color: colors.textTertiary },
  sectionTitle: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  factorRow: { flexDirection: 'row', gap: spacing.sm },
  factorBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  factorBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentGlow },
  factorText: { ...typography.subtitle, color: colors.textSecondary },
  factorTextActive: { color: colors.accentLight },
  appliedCount: {
    ...typography.caption,
    color: colors.accentLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
