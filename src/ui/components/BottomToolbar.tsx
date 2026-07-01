import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToolButton } from './ToolButton';
import { GlassPanel } from './GlassPanel';
import { colors, spacing, shadows } from '../theme';
import type { EditorTool } from '../../core/types';

const TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'adjust', label: 'Adjust', icon: '☀️' },
  { id: 'layers', label: 'Layers', icon: '📚' },
  { id: 'filters', label: 'Filters', icon: '🎭' },
  { id: 'effects', label: 'FX', icon: '✨' },
  { id: 'tone', label: 'Tone', icon: '🎨' },
  { id: 'selective', label: 'Local', icon: '🎯' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'focus', label: 'Focus', icon: '◎' },
  { id: 'heal', label: 'Heal', icon: '💫' },
  { id: 'transform', label: 'Skew', icon: '⬡' },
  { id: 'overlay', label: 'Blend', icon: '🖼' },
  { id: 'background', label: 'BG', icon: '🌄' },
  { id: 'enhance', label: 'Enhance', icon: '✦' },
  { id: 'crop', label: 'Crop', icon: '⬜' },
  { id: 'brush', label: 'Brush', icon: '✏️' },
  { id: 'export', label: 'Export', icon: '↗' },
];

interface BottomToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

export function BottomToolbar({ activeTool, onToolChange }: BottomToolbarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + spacing.sm }, shadows.toolbar]}>
      <GlassPanel style={styles.panel} padding={spacing.xs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              label={tool.label}
              icon={tool.icon}
              active={activeTool === tool.id}
              onPress={() => onToolChange(tool.id)}
            />
          ))}
        </ScrollView>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  panel: {
    borderRadius: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
});
