import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface ScrollPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxHeight?: number;
}

export function ScrollPanel({ children, style, maxHeight }: ScrollPanelProps) {
  return (
    <ScrollView
      style={[styles.container, maxHeight ? { maxHeight } : null, style]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingBottom: spacing.lg,
  },
});
