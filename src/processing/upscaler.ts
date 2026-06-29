import * as ImageManipulator from 'expo-image-manipulator';
import type { ProcessedImage } from './skiaFilters';
import { applyUnsharpMask } from './skiaFilters';

export type UpscaleFactor = 2 | 4 | 8;

export interface UpscaleOptions {
  factor: UpscaleFactor;
  /** 0–1 natural sharpening after upscale (default 0.55) */
  sharpening?: number;
  onProgress?: (step: number, total: number) => void;
}

/**
 * Progressive upscaling in 2× steps using native high-quality interpolation,
 * then a subtle unsharp mask to restore edge acutance without halos.
 *
 * Multi-pass 2× scaling produces significantly more natural results than
 * a single large jump — similar to Lanczos progressive upsampling.
 */
export async function progressiveUpscale(
  uri: string,
  width: number,
  height: number,
  options: UpscaleOptions
): Promise<ProcessedImage> {
  const { factor, sharpening = 0.55, onProgress } = options;
  const targetW = Math.round(width * factor);
  const targetH = Math.round(height * factor);

  let currentUri = uri;
  let currentW = width;
  let currentH = height;

  const stepsNeeded = Math.ceil(Math.log2(factor));
  const totalSteps = stepsNeeded + 1; // +1 for final sharpen pass
  let step = 0;

  // Progressive 2× passes — each uses the platform's bicubic/Lanczos resampler
  while (currentW < targetW) {
    step++;
    onProgress?.(step, totalSteps);

    const nextW = Math.min(currentW * 2, targetW);
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: nextW } }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );

    currentUri = result.uri;
    currentW = result.width;
    currentH = result.height;
  }

  // Exact target if aspect ratio rounding left us short
  if (currentW !== targetW) {
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: targetW, height: targetH } }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    currentUri = result.uri;
    currentW = result.width;
    currentH = result.height;
  }

  // Natural acutance restoration — radius scales with output size
  step++;
  onProgress?.(step, totalSteps);

  const radius = Math.max(0.8, Math.min(2.2, targetW / 2000));
  const sharpened = await applyUnsharpMask(currentUri, sharpening * 0.85, radius);

  return sharpened;
}
