import React from 'react';
import {
  Group,
  Rect,
  Oval,
  Circle,
  Text as SkiaText,
  Image as SkiaImage,
  useImage,
  matchFont,
  ColorMatrix,
} from '@shopify/react-native-skia';
import type { ImageRecipe, LocalEditLayer } from '../../core/types';
import {
  computeVignette,
  computeGrainOpacity,
  computeFadeOpacity,
  computeTiltShiftBands,
} from '../../rendering/finishingEffects';

const fontNormal = matchFont({ fontFamily: 'Helvetica', fontSize: 28, fontWeight: 'normal' });
const fontBold = matchFont({ fontFamily: 'Helvetica', fontSize: 28, fontWeight: 'bold' });

function OverlayImage({ layer, offsetX, offsetY, drawW, drawH }: {
  layer: import('../../core/types').OverlayImageLayer;
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
}) {
  const img = useImage(layer.uri);
  if (!img || !layer.visible) return null;
  return (
    <Group opacity={layer.opacity}>
      <SkiaImage
        image={img}
        x={offsetX}
        y={offsetY}
        width={drawW}
        height={drawH}
        fit="cover"
      />
    </Group>
  );
}

function LocalEditZones({
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
  const colors: Record<string, string> = {
    exposure: 'rgba(255,255,200,0.25)',
    contrast: 'rgba(128,128,128,0.3)',
    saturation: 'rgba(255,100,150,0.25)',
    warmth: 'rgba(255,150,50,0.25)',
  };

  return (
    <>
      {edits.filter((e) => e.visible).flatMap((edit) =>
        edit.strokes.flatMap((stroke, si) =>
          stroke.points.map((pt, pi) => (
            <Circle
              key={`${edit.id}-${si}-${pi}`}
              cx={offsetX + pt.x * drawW}
              cy={offsetY + pt.y * drawH}
              r={stroke.size * 0.6}
              color={colors[edit.editType] ?? 'rgba(10,132,255,0.2)'}
              opacity={edit.opacity * edit.amount}
            />
          ))
        )
      )}
    </>
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
      {recipe.overlayLayers.filter((l) => l.visible).map((layer) => (
        <OverlayImage
          key={layer.id}
          layer={layer}
          offsetX={offsetX}
          offsetY={offsetY}
          drawW={drawW}
          drawH={drawH}
        />
      ))}

      <LocalEditZones
        edits={recipe.localEdits}
        offsetX={offsetX}
        offsetY={offsetY}
        drawW={drawW}
        drawH={drawH}
      />

      {recipe.textLayers.filter((l) => l.visible).map((layer) => (
        <Group
          key={layer.id}
          opacity={layer.opacity}
          transform={[
            { translateX: offsetX + layer.x * drawW },
            { translateY: offsetY + layer.y * drawH },
            { rotate: (layer.rotation * Math.PI) / 180 },
          ]}
        >
          <SkiaText
            text={layer.text}
            x={0}
            y={0}
            font={layer.fontWeight === 'bold' ? fontBold : fontNormal}
            color={layer.color}
          />
        </Group>
      ))}

      {vignette && (
        <Oval
          x={offsetX + drawW / 2 - drawW * 0.55}
          y={offsetY + drawH / 2 - drawH * 0.55}
          width={drawW * 1.1}
          height={drawH * 1.1}
          color={`rgba(0,0,0,${vignette.amount * 0.65})`}
        />
      )}

      {fadeOpacity > 0 && (
        <Rect
          x={offsetX}
          y={offsetY}
          width={drawW}
          height={drawH}
          color={`rgba(240,235,225,${fadeOpacity})`}
        />
      )}

      {grainOpacity > 0 && (
        <>
          {Array.from({ length: 40 }).map((_, i) => (
            <Circle
              key={`grain-${i}`}
              cx={offsetX + ((i * 73) % 1000) / 1000 * drawW}
              cy={offsetY + ((i * 47) % 1000) / 1000 * drawH}
              r={0.8}
              color={`rgba(255,255,255,${grainOpacity * 0.5})`}
            />
          ))}
        </>
      )}

      {tiltBands && (
        <>
          <Rect
            x={0}
            y={0}
            width={canvasW}
            height={tiltBands.sharpTop}
            color={`rgba(255,255,255,${tiltBands.blurStrength * 0.08})`}
          />
          <Rect
            x={0}
            y={tiltBands.sharpBottom}
            width={canvasW}
            height={canvasH - tiltBands.sharpBottom}
            color={`rgba(255,255,255,${tiltBands.blurStrength * 0.08})`}
          />
          <Rect
            x={offsetX}
            y={tiltBands.sharpTop}
            width={drawW}
            height={tiltBands.sharpBottom - tiltBands.sharpTop}
            color="transparent"
            style="stroke"
            strokeWidth={1}
          />
        </>
      )}

      {showHealSpots &&
        recipe.healSpots.filter((s) => !s.healed).map((spot) => (
          <Circle
            key={spot.id}
            cx={offsetX + spot.x * drawW}
            cy={offsetY + spot.y * drawH}
            r={spot.radius * Math.min(drawW, drawH)}
            color="rgba(10,132,255,0.35)"
            style="stroke"
            strokeWidth={2}
          />
        ))}
    </>
  );
}

export function getPerspectiveTransform(
  perspective: ImageRecipe['perspective']
): [{ skewX: number }, { skewY: number }, { rotate: number }] {
  return [
    { skewX: perspective.horizontal * 0.35 },
    { skewY: perspective.vertical * 0.35 },
    { rotate: (perspective.rotation * Math.PI) / 180 },
  ];
}
