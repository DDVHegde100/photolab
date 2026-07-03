import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { exportImage, saveToGallery, shareImage } from './exportService';
import { saveRecipe } from '../../storage/imageStorage';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { ExportOptions } from '../../core/types';

const EXPORT_PROFILES: {
  id: string;
  label: string;
  description: string;
  options: ExportOptions;
}[] = [
  {
    id: 'web',
    label: 'Web / Share',
    description: 'Small, clean JPEG for posting or sending',
    options: { format: 'jpeg', quality: 0.88, scale: 1 },
  },
  {
    id: 'social',
    label: 'Social High',
    description: 'High quality for Instagram, X, Discord, and previews',
    options: { format: 'jpeg', quality: 0.94, scale: 2 },
  },
  {
    id: 'print',
    label: 'Print / Archive',
    description: 'Maximum detail for keeping or printing',
    options: { format: 'png', quality: 1, scale: 4 },
  },
  {
    id: 'anime',
    label: 'Anime / Art',
    description: 'Lossless export for flat color and crisp line art',
    options: { format: 'png', quality: 1, scale: 2 },
  },
];

export function ExportPanel() {
  const recipe = useEditorStore((s) => s.recipe);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'jpeg',
    quality: 0.95,
    scale: 1,
  });
  const [exporting, setExporting] = useState(false);

  if (!recipe) return null;

  const handleExport = async (action: 'save' | 'share') => {
    setExporting(true);
    try {
      const uri = await exportImage(recipe, options);
      await saveRecipe(recipe);

      if (action === 'save') {
        const saved = await saveToGallery(uri);
        Alert.alert(
          saved ? 'Exported' : 'Permission Required',
          saved
            ? 'Photo saved to your gallery at full quality.'
            : 'Please grant photo library access to save.'
        );
      } else {
        await shareImage(uri);
      }
    } catch (e) {
      Alert.alert('Export Failed', String(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Format</Text>
      <View style={styles.profileList}>
        {EXPORT_PROFILES.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profile}
            onPress={() => setOptions(profile.options)}
          >
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileLabel}>{profile.label}</Text>
              <Text style={styles.profileDesc}>{profile.description}</Text>
            </View>
            <Text style={styles.profileMeta}>
              {profile.options.format.toUpperCase()} · {profile.options.scale}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Manual Format</Text>
      <View style={styles.row}>
        {(['jpeg', 'png'] as const).map((fmt) => (
          <TouchableOpacity
            key={fmt}
            style={[styles.chip, options.format === fmt && styles.chipActive]}
            onPress={() => setOptions({ ...options, format: fmt })}
          >
            <Text style={[styles.chipText, options.format === fmt && styles.chipTextActive]}>
              {fmt.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Resolution</Text>
      <View style={styles.row}>
        {([1, 2, 4] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, options.scale === s && styles.chipActive]}
            onPress={() => setOptions({ ...options, scale: s })}
          >
            <Text style={[styles.chipText, options.scale === s && styles.chipTextActive]}>
              {s}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {options.format === 'jpeg' && (
        <Slider
          label="Quality"
          value={options.quality}
          min={0.5}
          max={1}
          onChange={(v) => setOptions({ ...options, quality: v })}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      )}

      <View style={styles.exportSummary}>
        <Text style={styles.summaryText}>
          Exporting {options.format.toUpperCase()} at {options.scale}x
          {options.format === 'jpeg' ? ` · ${Math.round(options.quality * 100)}% quality` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => handleExport('share')}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.shareText}>Share</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => handleExport('save')}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.saveText}>Save to Gallery</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectionTitle: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  profileList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  profileDesc: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  profileMeta: {
    ...typography.micro,
    color: colors.accentLight,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  chipText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accentLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  exportSummary: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  summaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shareBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  saveText: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
