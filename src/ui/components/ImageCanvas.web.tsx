import React, { useMemo } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { ImageRecipe } from '../../core/types';
import { adjustmentsToCSSFilter } from '../../rendering/webCanvas.web';
import { colors } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ImageCanvasProps {
  uri: string;
  recipe: ImageRecipe;
  isComparing?: boolean;
  comparePosition?: number;
  onComparePositionChange?: (position: number) => void;
  liveStroke?: import('../../core/types').BrushStroke | null;
  showMasks?: boolean;
}

export function ImageCanvas({
  uri,
  recipe,
  isComparing = false,
  comparePosition = 0.5,
  onComparePositionChange,
  showMasks = false,
}: ImageCanvasProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const cssFilter = useMemo(
    () => adjustmentsToCSSFilter(recipe.adjustments),
    [recipe.adjustments]
  );

  const canvasW = SCREEN_W;
  const canvasH = SCREEN_H * 0.55;
  const compareX = comparePosition * canvasW;

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

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, { height: canvasH }, animatedStyle]}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri }}
            style={[styles.image, { filter: cssFilter } as object]}
            resizeMode="contain"
          />

          {isComparing && (
            <View style={[styles.beforeClip, { width: compareX }]}>
              <Image
                source={{ uri: recipe.originalUri }}
                style={[styles.image, styles.beforeImage, { width: canvasW, height: canvasH }]}
                resizeMode="contain"
              />
              <View style={[styles.compareLine, { left: compareX - 1 }]} />
            </View>
          )}

          {showMasks &&
            recipe.masks.map((mask) =>
              mask.region ? (
                <View
                  key={mask.id}
                  style={[
                    styles.maskOverlay,
                    {
                      left: `${mask.region.x * 100}%`,
                      top: `${mask.region.y * 100}%`,
                      width: `${mask.region.width * 100}%`,
                      height: `${mask.region.height * 100}%`,
                      backgroundColor: mask.overlayColor,
                      opacity: mask.opacity * 0.4,
                      borderRadius: mask.region.kind.includes('ellipse') ? 9999 : 0,
                    },
                  ]}
                />
              ) : null
            )}
        </View>
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
  imageWrap: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  beforeClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  beforeImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  compareLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.compareLine,
  },
  maskOverlay: {
    position: 'absolute',
  },
});
