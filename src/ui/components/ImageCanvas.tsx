import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
  Group,
  Rect,
  Line,
  Oval,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { ImageRecipe, MaskData } from '../../core/types';
import { computeRenderParams } from '../../rendering/filterPipeline';
import { CanvasLayerEffects, getPerspectiveTransform } from './CanvasLayerEffects';
import { colors } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function MaskRegionOverlay({
  mask,
  offsetX,
  offsetY,
  drawW,
  drawH,
}: {
  mask: MaskData;
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
}) {
  if (!mask.region) return null;

  const { region } = mask;
  const rx = offsetX + region.x * drawW;
  const ry = offsetY + region.y * drawH;
  const rw = region.width * drawW;
  const rh = region.height * drawH;
  const opacity = mask.opacity * 0.45;
  const color = mask.overlayColor;

  if (region.kind === 'ellipse' || region.kind === 'gradient-radial') {
    return (
      <Oval
        x={rx}
        y={ry}
        width={rw}
        height={rh}
        color={color}
        opacity={region.invert ? opacity * 0.3 : opacity}
      />
    );
  }

  return (
    <Rect
      x={rx}
      y={ry}
      width={rw}
      height={rh}
      color={color}
      opacity={opacity}
    />
  );
}

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
  const image = useImage(uri);
  const originalImage = useImage(isComparing ? recipe.originalUri : null);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const renderParams = useMemo(() => computeRenderParams(recipe), [recipe]);
  const perspTransform = getPerspectiveTransform(recipe.perspective);

  const canvasW = SCREEN_W;
  const canvasH = height ?? SCREEN_H * 0.55;

  const imgW = image?.width() ?? canvasW;
  const imgH = image?.height() ?? canvasH;
  const fitScale = Math.min(canvasW / imgW, canvasH / imgH);
  const drawW = imgW * fitScale;
  const drawH = imgH * fitScale;
  const offsetX = (canvasW - drawW) / 2;
  const offsetY = (canvasH - drawH) / 2;

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

  const compareX = comparePosition * canvasW;

  if (!image) {
    return <View style={[styles.container, { height: canvasH }]} />;
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, { height: canvasH }, animatedStyle]}>
        <Canvas style={{ width: canvasW, height: canvasH }}>
          <Group>
            <Group transform={perspTransform}>
              <SkiaImage
                image={image}
                x={offsetX}
                y={offsetY}
                width={drawW}
                height={drawH}
                fit="contain"
              >
                <ColorMatrix matrix={renderParams.colorMatrix} />
              </SkiaImage>
            </Group>

            <CanvasLayerEffects
              recipe={recipe}
              offsetX={offsetX}
              offsetY={offsetY}
              drawW={drawW}
              drawH={drawH}
              canvasW={canvasW}
              canvasH={canvasH}
              showHealSpots={showHealSpots}
            />

            {recipe.drawingLayers.flatMap((layer) =>
              layer.visible
                ? layer.strokes.map((stroke, si) => (
                    <Group key={`${layer.id}-${si}`} opacity={layer.opacity * stroke.opacity}>
                      {stroke.points.length > 1 &&
                        stroke.points.slice(1).map((pt, i) => {
                          const prev = stroke.points[i];
                          const x1 = offsetX + prev.x * drawW;
                          const y1 = offsetY + prev.y * drawH;
                          const x2 = offsetX + pt.x * drawW;
                          const y2 = offsetY + pt.y * drawH;
                          return (
                            <Line
                              key={i}
                              p1={{ x: x1, y: y1 }}
                              p2={{ x: x2, y: y2 }}
                              color={stroke.color}
                              strokeWidth={stroke.size}
                            />
                          );
                        })}
                    </Group>
                  ))
                : []
            )}

            {liveStroke && liveStroke.points.length > 1 &&
              liveStroke.points.slice(1).map((pt, i) => {
                const prev = liveStroke.points[i];
                return (
                  <Line
                    key={`live-${i}`}
                    p1={{
                      x: offsetX + prev.x * drawW,
                      y: offsetY + prev.y * drawH,
                    }}
                    p2={{
                      x: offsetX + pt.x * drawW,
                      y: offsetY + pt.y * drawH,
                    }}
                    color={liveStroke.color}
                    strokeWidth={liveStroke.size}
                    opacity={liveStroke.opacity}
                  />
                );
              })}

            {showMasks &&
              recipe.masks.map((mask) => (
                <MaskRegionOverlay
                  key={mask.id}
                  mask={mask}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  drawW={drawW}
                  drawH={drawH}
                />
              ))}

            {showCropOverlay && recipe.crop && (
              <>
                <Rect
                  x={offsetX}
                  y={offsetY}
                  width={drawW}
                  height={drawH}
                  color="rgba(0,0,0,0.5)"
                />
                <Rect
                  x={offsetX + recipe.crop.x * drawW}
                  y={offsetY + recipe.crop.y * drawH}
                  width={recipe.crop.width * drawW}
                  height={recipe.crop.height * drawH}
                  color="transparent"
                  style="stroke"
                  strokeWidth={2}
                />
                <Rect
                  x={offsetX + recipe.crop.x * drawW}
                  y={offsetY + recipe.crop.y * drawH}
                  width={recipe.crop.width * drawW}
                  height={recipe.crop.height * drawH}
                  color="rgba(255,255,255,0.15)"
                />
              </>
            )}

            {isComparing && originalImage && (
              <>
                <Group clip={{ x: 0, y: 0, width: compareX, height: canvasH }}>
                  <SkiaImage
                    image={originalImage}
                    x={offsetX}
                    y={offsetY}
                    width={drawW}
                    height={drawH}
                    fit="contain"
                  />
                </Group>
                <Line
                  p1={{ x: compareX, y: 0 }}
                  p2={{ x: compareX, y: canvasH }}
                  color={colors.compareLine}
                  strokeWidth={2}
                />
                <Rect
                  x={compareX - 14}
                  y={canvasH / 2 - 14}
                  width={28}
                  height={28}
                  color="rgba(255,255,255,0.9)"
                />
              </>
            )}
          </Group>
        </Canvas>
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
});
