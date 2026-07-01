import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { ImageRecipe } from '../../core/types';
import { renderRecipeBaseLayer, type RenderLayout } from '../../rendering/webRenderPipeline.web';
import { loadHTMLImage } from '../../rendering/webCanvas.web';
import { CanvasLayerEffects, getPerspectiveTransformStyle } from './CanvasLayerEffects.web';
import { colors } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ImageCanvasProps {
  uri: string;
  recipe: ImageRecipe;
  height?: number;
  showCropOverlay?: boolean;
  isComparing?: boolean;
  comparePosition?: number;
  onComparePositionChange?: (position: number) => void;
  liveStroke?: import('../../core/types').BrushStroke | null;
  showMasks?: boolean;
  showHealSpots?: boolean;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function ImageCanvas({
  uri,
  recipe,
  height,
  showCropOverlay = false,
  isComparing = false,
  comparePosition = 0.5,
  onComparePositionChange,
  liveStroke,
  showMasks = false,
  showHealSpots = false,
}: ImageCanvasProps) {
  const containerRef = useRef<View>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [layout, setLayout] = useState<RenderLayout | null>(null);
  const [rendering, setRendering] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const canvasW = SCREEN_W;
  const canvasH = height ?? SCREEN_H * 0.55;
  const compareX = comparePosition * canvasW;
  const debouncedRecipe = useDebouncedValue(recipe, 80);

  const perspStyle = useMemo(
    () => getPerspectiveTransformStyle(debouncedRecipe.perspective),
    [debouncedRecipe.perspective]
  );

  useEffect(() => {
    const el = containerRef.current as unknown as HTMLDivElement | null;
    if (!el) return;

    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      el.appendChild(canvas);
      canvasRef.current = canvas;
    }

    let cancelled = false;
    setRendering(true);

    (async () => {
      try {
        const { canvas: rendered, layout: l } = await renderRecipeBaseLayer(
          debouncedRecipe,
          uri,
          canvasW,
          canvasH
        );
        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(rendered, 0, 0);
        setLayout(l);
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, debouncedRecipe, canvasW, canvasH]);

  useEffect(() => {
    if (!isComparing) return;
    const el = containerRef.current as unknown as HTMLDivElement | null;
    if (!el) return;

    if (!compareCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '2';
      el.appendChild(canvas);
      compareCanvasRef.current = canvas;
    }

    const compareCanvas = compareCanvasRef.current;
    compareCanvas.style.clipPath = `inset(0 ${100 - comparePosition * 100}% 0 0)`;

    let cancelled = false;
    (async () => {
      const img = await loadHTMLImage(recipe.originalUri);
      if (cancelled || !compareCanvas) return;
      compareCanvas.width = canvasW;
      compareCanvas.height = canvasH;
      const ctx = compareCanvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasW, canvasH);
      const fitScale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
      const drawW = img.naturalWidth * fitScale;
      const drawH = img.naturalHeight * fitScale;
      const ox = (canvasW - drawW) / 2;
      const oy = (canvasH - drawH) / 2;
      ctx.drawImage(img, ox, oy, drawW, drawH);
    })();

    return () => {
      cancelled = true;
    };
  }, [isComparing, recipe.originalUri, comparePosition, canvasW, canvasH]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.5), 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const comparePan = Gesture.Pan().onUpdate((e) => {
    if (onComparePositionChange) {
      const pos = Math.max(0.05, Math.min(0.95, e.x / canvasW));
      onComparePositionChange(pos);
    }
  });

  const gesture = Gesture.Simultaneous(pinch, isComparing ? comparePan : pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(scale.value, { damping: 20, stiffness: 200 }) },
    ],
  }));

  const offsetX = layout?.offsetX ?? 0;
  const offsetY = layout?.offsetY ?? 0;
  const drawW = layout?.drawW ?? canvasW;
  const drawH = layout?.drawH ?? canvasH;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, { height: canvasH }, animatedStyle]}>
        <View
          ref={containerRef}
          style={[styles.canvasHost, perspStyle]}
          collapsable={false}
        >
          {rendering && <View style={styles.renderingOverlay} pointerEvents="none" />}
        </View>

        {layout && (
          <>
            <CanvasLayerEffects
              recipe={debouncedRecipe}
              offsetX={offsetX}
              offsetY={offsetY}
              drawW={drawW}
              drawH={drawH}
              canvasW={canvasW}
              canvasH={canvasH}
              showHealSpots={showHealSpots}
            />

            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              {debouncedRecipe.drawingLayers.flatMap((layer) =>
                layer.visible
                  ? layer.strokes.flatMap((stroke, si) =>
                      stroke.points.length > 1
                        ? stroke.points.slice(1).map((pt, i) => {
                            const prev = stroke.points[i];
                            return (
                              <Line
                                key={`${layer.id}-${si}-${i}`}
                                x1={offsetX + prev.x * drawW}
                                y1={offsetY + prev.y * drawH}
                                x2={offsetX + pt.x * drawW}
                                y2={offsetY + pt.y * drawH}
                                stroke={stroke.color}
                                strokeWidth={stroke.size}
                                opacity={layer.opacity * stroke.opacity}
                              />
                            );
                          })
                        : []
                    )
                  : []
              )}

              {liveStroke &&
                liveStroke.points.length > 1 &&
                liveStroke.points.slice(1).map((pt, i) => {
                  const prev = liveStroke.points[i];
                  return (
                    <Line
                      key={`live-${i}`}
                      x1={offsetX + prev.x * drawW}
                      y1={offsetY + prev.y * drawH}
                      x2={offsetX + pt.x * drawW}
                      y2={offsetY + pt.y * drawH}
                      stroke={liveStroke.color}
                      strokeWidth={liveStroke.size}
                      opacity={liveStroke.opacity}
                    />
                  );
                })}

              {showCropOverlay && debouncedRecipe.crop && (
                <>
                  <Rect
                    x={offsetX}
                    y={offsetY}
                    width={drawW}
                    height={drawH}
                    fill="rgba(0,0,0,0.5)"
                  />
                  <Rect
                    x={offsetX + debouncedRecipe.crop.x * drawW}
                    y={offsetY + debouncedRecipe.crop.y * drawH}
                    width={debouncedRecipe.crop.width * drawW}
                    height={debouncedRecipe.crop.height * drawH}
                    fill="rgba(255,255,255,0.12)"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </>
              )}
            </Svg>

            {showMasks &&
              debouncedRecipe.masks.map((mask) =>
                mask.region ? (
                  <View
                    key={mask.id}
                    pointerEvents="none"
                    style={[
                      styles.maskOverlay,
                      {
                        left: offsetX + mask.region.x * drawW,
                        top: offsetY + mask.region.y * drawH,
                        width: mask.region.width * drawW,
                        height: mask.region.height * drawH,
                        backgroundColor: mask.overlayColor,
                        opacity: mask.opacity * 0.4,
                        borderRadius: mask.region.kind.includes('ellipse') ? 9999 : 0,
                      },
                    ]}
                  />
                ) : null
              )}

            {isComparing && (
              <>
                <View
                  pointerEvents="none"
                  style={[styles.compareLine, { left: compareX - 1 }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.compareHandle, { left: compareX - 14, top: canvasH / 2 - 14 }]}
                />
              </>
            )}
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  canvasHost: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  renderingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  maskOverlay: {
    position: 'absolute',
  },
  compareLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.compareLine,
  },
  compareHandle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
