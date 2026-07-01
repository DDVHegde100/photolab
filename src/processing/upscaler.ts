import type { ProcessedImage } from './types';
import { skiaProgressiveResize, probeImageDimensions } from './skiaResize';
import { applyPreUpscaleDenoise, applyUpscaleFinish, applyClarityBoost } from './detailEnhancement';

export type UpscaleFactor = 2 | 4 | 8;

export type UpscaleQuality = 'standard' | 'high' | 'max';

export interface UpscaleOptions {
  factor: UpscaleFactor;
  /** 0–1 detail recovery strength (default 0.75) */
  sharpening?: number;
  quality?: UpscaleQuality;
  onProgress?: (step: number, total: number, label?: string) => void;
}

const QUALITY_STRENGTH: Record<UpscaleQuality, number> = {
  standard: 0.55,
  high: 0.75,
  max: 0.92,
};

/**
 * Professional multi-pass super-resolution pipeline:
 * 1. Probe true dimensions
 * 2. Pre-denoise to avoid amplifying sensor grain
 * 3. Progressive Skia 2× GPU upscales (cubic sampling)
 * 4. Edge-adaptive detail recovery
 * 5. Luminance-only sharpening (no color fringing)
 * 6. Micro-contrast clarity finish
 */
export async function progressiveUpscale(
  uri: string,
  width: number,
  height: number,
  options: UpscaleOptions
): Promise<ProcessedImage> {
  const { factor, quality = 'high', onProgress } = options;
  const sharpening = options.sharpening ?? QUALITY_STRENGTH[quality];

  let dims = { width, height };
  if (width <= 0 || height <= 0) {
    dims = await probeImageDimensions(uri);
  }

  const targetW = Math.round(dims.width * factor);
  const targetH = Math.round(dims.height * factor);
  const totalSteps = 5;
  let step = 0;

  step++;
  onProgress?.(step, totalSteps, 'Preparing');
  const prepared = await applyPreUpscaleDenoise(uri, sharpening * 0.4);

  step++;
  onProgress?.(step, totalSteps, 'Upscaling');
  const upscaled = await skiaProgressiveResize(
    prepared.uri,
    prepared.width,
    prepared.height,
    targetW,
    targetH,
    (s, t) => onProgress?.(step, totalSteps, `Scale ${s}/${t}`)
  );

  step++;
  onProgress?.(step, totalSteps, 'Detail recovery');
  const detailed = await applyUpscaleFinish(upscaled.uri, targetW, sharpening);

  step++;
  onProgress?.(step, totalSteps, 'Clarity');
  const clarified = await applyClarityBoost(detailed.uri, sharpening * 0.5);

  step++;
  onProgress?.(step, totalSteps, 'Done');

  return {
    uri: clarified.uri,
    width: targetW,
    height: targetH,
  };
}

export { probeImageDimensions };
