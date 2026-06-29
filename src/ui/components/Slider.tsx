import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { selectionHaptic } from '../../platform/haptics';
import { colors, spacing, typography } from '../theme';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
  onChangeEnd,
  formatValue,
}: SliderProps) {
  const trackWidth = useSharedValue(0);
  const normalized = (value - min) / (max - min);

  const triggerHaptic = useCallback(() => {
    selectionHaptic();
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const ratio = Math.max(0, Math.min(1, e.x / trackWidth.value));
      const newValue = min + ratio * (max - min);
      runOnJS(onChange)(Math.round(newValue * 100) / 100);
    })
    .onEnd(() => {
      if (onChangeEnd) runOnJS(onChangeEnd)(value);
      runOnJS(triggerHaptic)();
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const ratio = Math.max(0, Math.min(1, e.x / trackWidth.value));
    const newValue = min + ratio * (max - min);
    runOnJS(onChange)(Math.round(newValue * 100) / 100);
    runOnJS(triggerHaptic)();
  });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${normalized * 100}%`,
  }));

  const displayValue = formatValue
    ? formatValue(value)
    : value > 0
      ? `+${value.toFixed(2)}`
      : value.toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          style={styles.track}
          onLayout={(e) => {
            trackWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <Animated.View style={[styles.fill, fillStyle]} />
          <View
            style={[
              styles.thumb,
              { left: `${normalized * 100}%` },
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const THUMB_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  value: {
    ...typography.caption,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
    minWidth: 48,
    textAlign: 'right',
  },
  track: {
    height: 4,
    backgroundColor: colors.sliderTrack,
    borderRadius: 2,
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.sliderFill,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -(THUMB_SIZE - 4) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.textPrimary,
    marginLeft: -THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
