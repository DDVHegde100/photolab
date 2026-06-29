import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../core/store';
import type { BrushStroke } from '../../core/types';

interface DrawingOverlayProps {
  width: number;
  height: number;
  enabled: boolean;
  onStrokeUpdate?: (stroke: BrushStroke | null) => void;
}

export function DrawingOverlay({ width, height, enabled, onStrokeUpdate }: DrawingOverlayProps) {
  const brushSettings = useEditorStore((s) => s.brushSettings);
  const recipe = useEditorStore((s) => s.recipe);
  const addDrawingLayer = useEditorStore((s) => s.addDrawingLayer);
  const addStrokeToLayer = useEditorStore((s) => s.addStrokeToLayer);
  const activeLayerRef = useRef<string | null>(null);
  const currentStrokeRef = useRef<BrushStroke | null>(null);

  const ensureLayer = useCallback(() => {
    if (activeLayerRef.current) return activeLayerRef.current;
    const id = uuidv4();
    addDrawingLayer({
      id,
      name: `Layer ${(recipe?.drawingLayers.length ?? 0) + 1}`,
      strokes: [],
      visible: true,
      opacity: brushSettings.tool === 'enhancement' ? 0.35 : 1,
      blendMode: brushSettings.tool === 'enhancement' ? 'soft-light' : 'normal',
    });
    activeLayerRef.current = id;
    return id;
  }, [addDrawingLayer, recipe?.drawingLayers.length, brushSettings.tool]);

  const startStroke = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;
      ensureLayer();
      const nx = x / width;
      const ny = y / height;

      const stroke: BrushStroke = {
        points: [{ x: nx, y: ny }],
        size: brushSettings.size,
        opacity: brushSettings.opacity,
        hardness: brushSettings.hardness,
        color: brushSettings.tool === 'eraser' ? '#000000' : brushSettings.color,
        tool: brushSettings.tool,
        enhancementType: brushSettings.enhancementType,
      };

      currentStrokeRef.current = stroke;
      onStrokeUpdate?.(stroke);
    },
    [enabled, ensureLayer, width, height, brushSettings, onStrokeUpdate]
  );

  const extendStroke = useCallback(
    (x: number, y: number) => {
      if (!enabled || !currentStrokeRef.current) return;
      const nx = x / width;
      const ny = y / height;
      currentStrokeRef.current.points.push({ x: nx, y: ny });
      onStrokeUpdate?.({ ...currentStrokeRef.current, points: [...currentStrokeRef.current.points] });
    },
    [enabled, width, height, onStrokeUpdate]
  );

  const endStroke = useCallback(() => {
    if (currentStrokeRef.current && activeLayerRef.current) {
      addStrokeToLayer(activeLayerRef.current, {
        ...currentStrokeRef.current,
        points: [...currentStrokeRef.current.points],
      });
    }
    currentStrokeRef.current = null;
    onStrokeUpdate?.(null);
  }, [addStrokeToLayer, onStrokeUpdate]);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .minDistance(0)
    .onStart((e) => {
      runOnJS(startStroke)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(extendStroke)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(endStroke)();
    });

  if (!enabled) return null;

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.overlay, { width, height }]} />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
