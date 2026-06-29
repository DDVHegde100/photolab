import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { historyManager } from '../../core/historyManager';
import { colors, spacing, typography, radius } from '../theme';

interface HistoryTimelineProps {
  onScrub: (index: number) => void;
}

export function HistoryTimeline({ onScrub }: HistoryTimelineProps) {
  const timeline = historyManager.getTimeline();
  const currentIndex = historyManager.getCurrentIndex();

  if (timeline.length <= 1) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {timeline.map((entry, index) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.chip, index === currentIndex && styles.chipActive]}
            onPress={() => onScrub(index)}
          >
            <Text
              style={[styles.chipText, index === currentIndex && styles.chipTextActive]}
              numberOfLines={1}
            >
              {entry.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    maxWidth: 100,
  },
  chipTextActive: {
    color: colors.accentLight,
  },
});
