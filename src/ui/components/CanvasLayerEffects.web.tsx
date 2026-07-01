import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import type { ImageRecipe, LocalEditLayer, OverlayImageLayer } from '../../core/types';
import {
  computeVignette,
  computeGrainOpacity,
  computeFadeOpacity,
  computeTiltShiftBands,
} from '../../rendering/finishingEffects';
import { colors } from '../theme';

const BLEND_MODE_CSS: Record<string, string> = {
  normal: 'normal',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  'hard-light': 'hard-light',
};

function OverlayImageWeb({
  layer,
  offsetX,
  offsetY,
  drawW,
  drawH,
}: {
  layer: OverlayImageLayer;
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
}) {
  if (!layer.visible) return null;
  return (
    <Image
      source={{ uri: layer.uri }}
      style={[
        styles.overlayImage,
        {
          left: offsetX,
          top: offsetY,
          width: drawW,
          height: drawH,
          opacity: layer.opacity,
        },
        { mixBlendMode: BLEND_MODE_CSS[layer.blendMode] ?? 'normal' } as object,
      ]}
      resizeMode="cover"
    />
  );
}

function LocalEditZonesWeb({
  edits,
  offsetX,
  offsetY,
  drawW,
  drawH,
}: {
  edits: LocalEditLayer[];
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
}) {
  const zoneColors: Record<string, string> = {
    exposure: 'rgba(255,255,200,0.25)',
    contrast: 'rgba(128,128,128,0.3)',
    saturation: 'rgba(255,100,150,0.25)',
    warmth: 'rgba(255,150,50,0.25)',
  };

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {edits
        .filter((e) => e.visible)
        .flatMap((edit) =>
          edit.strokes.flatMap((stroke, si) =>
            stroke.points.map((pt, pi) => (
              <Circle
                key={`${edit.id}-${si}-${pi}`}
                cx={offsetX + pt.x * drawW}
                cy={offsetY + pt.y * drawH}
                r={stroke.size * 0.6}
                fill={zoneColors[edit.editType] ?? 'rgba(10,132,255,0.2)'}
                opacity={edit.opacity * edit.amount}
              />
            ))
          )
        )}
    </Svg>
  );
}

interface CanvasLayerEffectsProps {
  recipe: ImageRecipe;
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
  canvasW: number;
  canvasH: number;
  showHealSpots?: boolean;
}

export function CanvasLayerEffects({
  recipe,
  offsetX,
  offsetY,
  drawW,
  drawH,
  canvasW,
  canvasH,
  showHealSpots,
}: CanvasLayerEffectsProps) {
  const vignette = computeVignette(recipe.finishing, drawW, drawH);
  const grainOpacity = computeGrainOpacity(recipe.finishing);
  const fadeOpacity = computeFadeOpacity(recipe.finishing);
  const tiltBands = computeTiltShiftBands(recipe.tiltShift, drawH, offsetY);

  return (
    <>
      {recipe.overlayLayers.map((layer) => (
        <OverlayImageWeb
          key={layer.id}
          layer={layer}
          offsetX={offsetX}
          offsetY={offsetY}
          drawW={drawW}
          drawH={drawH}
        />
      ))}

      <LocalEditZonesWeb
        edits={recipe.localEdits}
        offsetX={offsetX}
        offsetY={offsetY}
        drawW={drawW}
        drawH={drawH}
      />

      {recipe.textLayers
        .filter((l) => l.visible)
        .map((layer) => (
          <Text
            key={layer.id}
            style={[
              styles.textLayer,
              {
                left: offsetX + layer.x * drawW,
                top: offsetY + layer.y * drawH,
                fontSize: layer.fontSize,
                color: layer.color,
                opacity: layer.opacity,
                fontWeight: layer.fontWeight,
                transform: [{ rotate: `${layer.rotation}deg` }],
              },
            ]}
          >
            {layer.text}
          </Text>
        ))}

      {vignette && (
        <View
          pointerEvents="none"
          style={[
            styles.vignette,
            {
              left: offsetX + drawW / 2 - drawW * 0.55,
              top: offsetY + drawH / 2 - drawH * 0.55,
              width: drawW * 1.1,
              height: drawH * 1.1,
              borderRadius: drawW,
              backgroundColor: `rgba(0,0,0,${vignette.amount * 0.65})`,
            },
          ]}
        />
      )}

      {fadeOpacity > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            width: drawW,
            height: drawH,
            backgroundColor: `rgba(240,235,225,${fadeOpacity})`,
          }}
        />
      )}

      {grainOpacity > 0 &&
        Array.from({ length: 40 }).map((_, i) => (
          <View
            key={`grain-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: offsetX + (((i * 73) % 1000) / 1000) * drawW,
              top: offsetY + (((i * 47) % 1000) / 1000) * drawH,
              width: 1.6,
              height: 1.6,
              borderRadius: 1,
              backgroundColor: `rgba(255,255,255,${grainOpacity * 0.5})`,
            }}
          />
        ))}

      {tiltBands && (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: canvasW,
              height: tiltBands.sharpTop,
              backgroundColor: `rgba(255,255,255,${tiltBands.blurStrength * 0.08})`,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: tiltBands.sharpBottom,
              width: canvasW,
              height: canvasH - tiltBands.sharpBottom,
              backgroundColor: `rgba(255,255,255,${tiltBands.blurStrength * 0.08})`,
            }}
          />
        </>
      )}

      {showHealSpots && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {recipe.healSpots
            .filter((s) => !s.healed)
            .map((spot) => (
              <Circle
                key={spot.id}
                cx={offsetX + spot.x * drawW}
                cy={offsetY + spot.y * drawH}
                r={spot.radius * Math.min(drawW, drawH)}
                stroke={colors.accent}
                strokeWidth={2}
                fill="rgba(10,132,255,0.35)"
              />
            ))}
        </Svg>
      )}
    </>
  );
}

export function getPerspectiveTransformStyle(
  perspective: ImageRecipe['perspective']
): { transform: [{ rotate: string }, { skewX: string }, { skewY: string }] } {
  return {
    transform: [
      { rotate: `${perspective.rotation}deg` },
      { skewX: `${perspective.horizontal * 20}deg` },
      { skewY: `${perspective.vertical * 20}deg` },
    ],
  };
}

const styles = StyleSheet.create({
  overlayImage: {
    position: 'absolute',
  },
  textLayer: {
    position: 'absolute',
  },
  vignette: {
    position: 'absolute',
  },
});
