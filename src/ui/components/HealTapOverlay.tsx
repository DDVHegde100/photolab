import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';

interface HealTapOverlayProps {
  width: number;
  height: number;
  enabled: boolean;
  radius: number;
}

export function HealTapOverlay({ width, height, enabled, radius }: HealTapOverlayProps) {
  const addHealSpot = useEditorStore((s) => s.addHealSpot);

  if (!enabled) return null;

  const handleTap = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    const { locationX, locationY } = event.nativeEvent;
    addHealSpot({
      id: uuidv4(),
      x: locationX / width,
      y: locationY / height,
      radius,
      healed: false,
    });
  };

  return (
    <Pressable style={[styles.overlay, { width, height }]} onPress={handleTap} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
