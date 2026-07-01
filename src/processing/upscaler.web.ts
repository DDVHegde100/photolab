import type { ProcessedImage } from './types';
import { resizeCanvas } from '../rendering/webCanvas.web';
import { applyPreUpscaleDenoise, applyUpscaleFinish, applyClarityBoost } from './detailEnhancement.web';

export type UpscaleFactor = 2 | 4 | 8;
export type UpscaleQuality = 'standard' | 'high' | 'max';

export interface UpscaleOptions {
  factor: UpscaleFactor;
  sharpening?: number;
  quality?: UpscaleQuality;
  onProgress?: (step: number, total: number, label?: string) => void;
}

import { probeImageDimensions as probeDims } from './skiaResize.web';

export async function probeImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return probeDims(uri);
}

export async function progressiveUpscale(
  uri: string,
  width: number,
  height: number,
  options: UpscaleOptions
): Promise<ProcessedImage> {
  const { factor, quality = 'high', onProgress } = options;
  const sharpening = options.sharpening ?? (quality === 'max' ? 0.92 : quality === 'high' ? 0.75 : 0.55);
  const baseW = width || 1000;
  const baseH = height || 1000;
  const targetW = Math.round(baseW * factor);
  const targetH = Math.round(baseH * factor);

  let currentUri = uri;
  let currentW = baseW;

  onProgress?.(1, 5, 'Preparing');
  const prepared = await applyPreUpscaleDenoise(currentUri, sharpening * 0.4);
  currentUri = prepared.uri;

  onProgress?.(2, 5, 'Upscaling');
  while (currentW < targetW) {
    const nextW = Math.min(currentW * 2, targetW);
    const result = await resizeCanvas(currentUri, nextW, 'high');
    currentUri = result.uri;
    currentW = result.width;
  }

  onProgress?.(3, 5, 'Detail recovery');
  const detailed = await applyUpscaleFinish(currentUri, targetW, sharpening);
  currentUri = detailed.uri;

  onProgress?.(4, 5, 'Clarity');
  const clarified = await applyClarityBoost(currentUri, sharpening * 0.5);

  onProgress?.(5, 5, 'Done');
  return { uri: clarified.uri, width: targetW, height: targetH };
}
