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
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Text style={[styles.icon, active && styles.iconActive]}>{icon}</Text>
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 58,
  },
  buttonActive: {},
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconWrapActive: {
    backgroundColor: colors.accentGlow,
  },
  icon: {
    fontSize: 20,
    opacity: 0.55,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    ...typography.micro,
    color: colors.toolInactive,
  },
  labelActive: {
    color: colors.toolActive,
    fontWeight: '600',
  },
});
