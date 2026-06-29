import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToolButton } from './ToolButton';
import { GlassPanel } from './GlassPanel';
import { colors, spacing } from '../theme';
import type { EditorTool } from '../../core/types';

const TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'adjust', label: 'Adjust', icon: '☀️' },
  { id: 'crop', label: 'Crop', icon: '⬜' },
  { id: 'mask', label: 'Mask', icon: '◎' },
  { id: 'brush', label: 'Brush', icon: '✏️' },
  { id: 'enhance', label: 'Enhance', icon: '✦' },
  { id: 'export', label: 'Export', icon: '↗' },
];

interface BottomToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

export function BottomToolbar({ activeTool, onToolChange }: BottomToolbarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + spacing.sm }]}>
      <GlassPanel style={styles.panel} padding={spacing.sm}>
        <View style={styles.row}>
          {TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              label={tool.label}
              icon={tool.icon}
              active={activeTool === tool.id}
              onPress={() => onToolChange(tool.id)}
            />
          ))}
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  panel: {
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
