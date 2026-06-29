import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { impactHaptic, ImpactFeedbackStyle } from '../../platform/haptics';
import { colors, spacing, typography, radius } from '../theme';

interface ToolButtonProps {
  label: string;
  icon: string;
  active?: boolean;
  onPress: () => void;
}

export function ToolButton({ label, icon, active, onPress }: ToolButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.buttonActive]}
      onPress={() => {
        impactHaptic(ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, active && styles.iconActive]}>{icon}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {active && <View style={styles.indicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 64,
    position: 'relative',
  },
  buttonActive: {},
  icon: {
    fontSize: 22,
    marginBottom: spacing.xs,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    ...typography.micro,
    color: colors.toolInactive,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.toolActive,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
});
