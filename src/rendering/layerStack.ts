import type { AdjustmentLayer, AdjustmentValues } from '../core/types';
import { DEFAULT_ADJUSTMENTS } from '../core/defaults';
import { buildColorMatrix } from './colorMatrix';

function blendMatrices(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v * (1 - t) + b[i] * t);
}

/** Composite visible adjustment layers onto a base color matrix. */
export function mergeAdjustmentLayers(
  baseMatrix: number[],
  layers: AdjustmentLayer[]
): number[] {
  let matrix = baseMatrix;

  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    const layerMatrix = buildColorMatrix({ ...DEFAULT_ADJUSTMENTS, ...layer.adjustments });
    matrix = blendMatrices(matrix, layerMatrix, layer.opacity);
  }

  return matrix;
}

export function mergeLayerAdjustments(layers: AdjustmentLayer[]): Partial<AdjustmentValues> {
  const merged: Partial<AdjustmentValues> = {};
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const [key, val] of Object.entries(layer.adjustments) as [keyof AdjustmentValues, number][]) {
      merged[key] = ((merged[key] ?? 0) + val * layer.opacity) as never;
    }
  }
  return merged;
}
