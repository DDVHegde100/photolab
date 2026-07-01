import type { ImageRecipe, AdjustmentValues } from '../core/types';
import { DEFAULT_ADJUSTMENTS } from '../core/defaults';
import { buildColorMatrix, curveToLUT, applyCurveMatrix } from './colorMatrix';
import { hslToColorMatrix, colorGradeToMatrix } from './hslProcessor';
import { getPresetAdjustments } from '../assets/presets';
import { mergeAdjustmentLayers } from './layerStack';
import { splitToneToMatrix } from './splitTone';

export interface RenderParams {
  colorMatrix: number[];
  opacity: number;
  cropRect: { x: number; y: number; width: number; height: number } | null;
}

export function computeRenderParams(recipe: ImageRecipe): RenderParams {
  let matrix = buildColorMatrix(recipe.adjustments);

  if (recipe.activeFilter) {
    const preset = getPresetAdjustments(recipe.activeFilter);
    if (preset) {
      const presetMatrix = buildColorMatrix({ ...DEFAULT_ADJUSTMENTS, ...preset });
      const intensity = recipe.filterIntensity ?? 1;
      matrix = blendMatrices(matrix, presetMatrix, intensity);
    }
  }

  const hslMatrix = hslToColorMatrix(recipe.hsl);
  matrix = multiplyMatrices(matrix, hslMatrix);

  const gradeMatrix = colorGradeToMatrix(recipe.colorGrade);
  matrix = multiplyMatrices(matrix, gradeMatrix);

  const rgbLUT = curveToLUT(recipe.curves.rgb);
  matrix = applyCurveMatrix(matrix, rgbLUT);

  if (recipe.splitTone && (recipe.splitTone.shadowSaturation !== 0 || recipe.splitTone.highlightSaturation !== 0)) {
    matrix = multiplyMatrices(matrix, splitToneToMatrix(recipe.splitTone));
  }

  if (recipe.adjustmentLayers?.length) {
    matrix = mergeAdjustmentLayers(matrix, recipe.adjustmentLayers);
  }

  return {
    colorMatrix: matrix,
    opacity: 1,
    cropRect: recipe.crop
      ? {
          x: recipe.crop.x,
          y: recipe.crop.y,
          width: recipe.crop.width,
          height: recipe.crop.height,
        }
      : null,
  };
}

function multiplyMatrices(a: number[], b: number[]): number[] {
  const result = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      if (col === 4) sum += a[row * 5 + 4];
      result[row * 5 + col] = sum;
    }
  }
  return result;
}

function blendMatrices(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v * (1 - t) + b[i] * t);
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export const ADJUSTMENT_RANGES: Record<
  keyof AdjustmentValues,
  { min: number; max: number; default: number; label: string }
> = {
  exposure: { min: -2, max: 2, default: 0, label: 'Exposure' },
  contrast: { min: -1, max: 1, default: 0, label: 'Contrast' },
  highlights: { min: -1, max: 1, default: 0, label: 'Highlights' },
  shadows: { min: -1, max: 1, default: 0, label: 'Shadows' },
  whites: { min: -1, max: 1, default: 0, label: 'Whites' },
  blacks: { min: -1, max: 1, default: 0, label: 'Blacks' },
  temperature: { min: -100, max: 100, default: 0, label: 'Temperature' },
  tint: { min: -100, max: 100, default: 0, label: 'Tint' },
  vibrance: { min: -1, max: 1, default: 0, label: 'Vibrance' },
  saturation: { min: -1, max: 1, default: 0, label: 'Saturation' },
  clarity: { min: -1, max: 1, default: 0, label: 'Clarity' },
  texture: { min: -1, max: 1, default: 0, label: 'Texture' },
  sharpness: { min: -1, max: 1, default: 0, label: 'Sharpness' },
};

export const BASIC_ADJUSTMENTS: (keyof AdjustmentValues)[] = [
  'exposure',
  'contrast',
  'highlights',
  'shadows',
  'whites',
  'blacks',
];

export const COLOR_ADJUSTMENTS: (keyof AdjustmentValues)[] = [
  'temperature',
  'tint',
  'vibrance',
  'saturation',
];

export const DETAIL_ADJUSTMENTS: (keyof AdjustmentValues)[] = [
  'clarity',
  'texture',
  'sharpness',
];
