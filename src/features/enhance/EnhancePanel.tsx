import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { PanelHeader } from '../../ui/components/PanelHeader';
import { ScrollPanel } from '../../ui/components/ScrollPanel';
import { imageProcessor } from '../../processing';
import type { UpscaleQuality } from '../../processing/upscaler';
import { colors, spacing, typography, radius } from '../../ui/theme';

const ENHANCE_TOOLS = [
  {
    id: 'upscale',
    label: 'Super Resolution',
    description: 'Multi-pass GPU upscale with detail recovery',
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
  {
    id: 'anime-clean',
    label: 'Anime / Illustration',
    description: 'Smooth flat color, restore crisp ink edges',
    icon: '✒',
  },
  {
    id: 'artifact-clean',
    label: 'Compression Cleanup',
    description: 'Reduce JPEG blocks and social-media artifacts',
    icon: '▦',
  },
  {
    id: 'line-art',
    label: 'Line Art / Text',
    description: 'Sharpen scans, manga panels, and screenshots',
    icon: 'A',
  },
];

const QUALITY_MODES: { id: UpscaleQuality; label: string }[] = [
  { id: 'standard', label: 'Fast' },
  { id: 'high', label: 'High' },
  { id: 'max', label: 'Max' },
];

export function EnhancePanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const currentImage = useEditorStore((s) => s.currentImage);
  const applyEnhancement = useEditorStore((s) => s.applyEnhancement);
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4 | 8>(2);
  const [quality, setQuality] = useState<UpscaleQuality>('high');
  const [strength, setStrength] = useState(0.75);

  if (!recipe || !currentImage) return null;

  const sourceUri = recipe.workingUri ?? recipe.originalUri;
  const input = {
    uri: sourceUri,
    width: currentImage.width,
    height: currentImage.height,
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
            upscaleQuality: quality,
            onProgress: (step, total, label) =>
              setProgress(label ?? `${step}/${total}`),
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
        case 'anime-clean':
          result = await imageProcessor.animeCleanup(input, strength);
          applyEnhancement({ type: 'anime-clean', strength, appliedAt: Date.now() }, result);
          break;
        case 'artifact-clean':
          result = await imageProcessor.artifactCleanup(input, strength);
          applyEnhancement({ type: 'artifact-clean', strength, appliedAt: Date.now() }, result);
          break;
        case 'line-art':
          result = await imageProcessor.lineArtCleanup(input, strength);
          applyEnhancement({ type: 'line-art', strength, appliedAt: Date.now() }, result);
          break;
      }
    } finally {
      setLoading(null);
      setProgress(null);
    }
  };

  return (
    <ScrollPanel>
      <PanelHeader
        title="Enhance"
        subtitle="Algorithmic quality improvements"
      />

      <View style={styles.body}>
        <Slider label="Strength" value={strength} min={0} max={1} onChange={setStrength} />

        <Text style={styles.sectionTitle}>Upscale Quality</Text>
        <View style={styles.factorRow}>
          {QUALITY_MODES.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={[styles.factorBtn, quality === q.id && styles.factorBtnActive]}
              onPress={() => setQuality(q.id)}
            >
              <Text style={[styles.factorText, quality === q.id && styles.factorTextActive]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        {recipe.enhancements.length > 0 && (
          <Text style={styles.appliedCount}>
            {recipe.enhancements.length} enhancement(s) applied
          </Text>
        )}
      </View>
    </ScrollPanel>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  factorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
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
  factorText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  factorTextActive: { color: colors.accentLight },
  appliedCount: {
    ...typography.caption,
    color: colors.accentLight,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
