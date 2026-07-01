import { applyUnsharpMask } from './skiaFilters.web';
import type { ProcessedImage } from './types';

export async function applyPreUpscaleDenoise(uri: string, strength: number): Promise<ProcessedImage> {
  const t = Math.min(Math.max(strength, 0), 1);
  if (t < 0.05) return { uri, width: 0, height: 0 };
  return applyUnsharpMask(uri, t * 0.2, 0.8);
}

export async function applyUpscaleFinish(
  uri: string,
  targetW: number,
  strength: number
): Promise<ProcessedImage> {
  const radius = Math.max(0.6, Math.min(2.0, targetW / 2400));
  return applyUnsharpMask(uri, strength * 0.65, radius);
}

export async function applyClarityBoost(uri: string, strength: number): Promise<ProcessedImage> {
  return applyUnsharpMask(uri, strength * 0.35, 0.7);
}
