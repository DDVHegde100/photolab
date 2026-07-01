import type { FinishingEffects, TiltShift } from '../core/types';

export interface VignetteParams {
  amount: number;
  roundness: number;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
}

export function computeVignette(
  effects: FinishingEffects,
  width: number,
  height: number
): VignetteParams | null {
  if (effects.vignetteAmount <= 0) return null;
  const amount = Math.min(Math.max(effects.vignetteAmount, 0), 1);
  const roundness = Math.min(Math.max(effects.vignetteRoundness, 0), 1);
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  return {
    amount,
    roundness,
    centerX: cx,
    centerY: cy,
    innerRadius: maxR * (0.35 + roundness * 0.25),
    outerRadius: maxR * (0.85 + (1 - amount) * 0.15),
  };
}

export function computeGrainOpacity(effects: FinishingEffects): number {
  return Math.min(Math.max(effects.grainAmount, 0), 1) * 0.25;
}

export function computeFadeOpacity(effects: FinishingEffects): number {
  return Math.min(Math.max(effects.fadeAmount, 0), 1) * 0.45;
}

export function computeTiltShiftBands(
  tilt: TiltShift,
  drawH: number,
  offsetY: number
): { sharpTop: number; sharpBottom: number; blurStrength: number } | null {
  if (!tilt.enabled || tilt.blurAmount <= 0) return null;
  const center = offsetY + tilt.centerY * drawH;
  const halfBand = (tilt.bandSize * drawH) / 2;
  return {
    sharpTop: center - halfBand,
    sharpBottom: center + halfBand,
    blurStrength: tilt.blurAmount,
  };
}
