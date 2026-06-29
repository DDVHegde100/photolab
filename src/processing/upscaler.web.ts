import type { ProcessedImage } from './skiaFilters';
import { applyUnsharpMask } from './skiaFilters';
import { resizeCanvas } from '../rendering/webCanvas.web';

export type UpscaleFactor = 2 | 4 | 8;

export interface UpscaleOptions {
  factor: UpscaleFactor;
  sharpening?: number;
  onProgress?: (step: number, total: number) => void;
}

export async function progressiveUpscale(
  uri: string,
  width: number,
  height: number,
  options: UpscaleOptions
): Promise<ProcessedImage> {
  const { factor, sharpening = 0.55, onProgress } = options;
  const targetW = Math.round(width * factor);

  let currentUri = uri;
  let currentW = width;
  const stepsNeeded = Math.ceil(Math.log2(factor));
  const totalSteps = stepsNeeded + 1;
  let step = 0;

  while (currentW < targetW) {
    step++;
    onProgress?.(step, totalSteps);
    const nextW = Math.min(currentW * 2, targetW);
    const result = await resizeCanvas(currentUri, nextW, 'high');
    currentUri = result.uri;
    currentW = result.width;
  }

  if (currentW !== targetW) {
    const result = await resizeCanvas(currentUri, targetW, 'high');
    currentUri = result.uri;
  }

  step++;
  onProgress?.(step, totalSteps);

  const radius = Math.max(0.8, Math.min(2.2, targetW / 2000));
  return applyUnsharpMask(currentUri, sharpening * 0.85, radius);
}
