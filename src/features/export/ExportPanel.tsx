import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useEditorStore } from '../../core/store';
import { Slider } from '../../ui/components/Slider';
import { exportImage, saveToGallery, shareImage } from './exportService';
import { saveRecipe } from '../../storage/imageStorage';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { ExportOptions } from '../../core/types';

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
