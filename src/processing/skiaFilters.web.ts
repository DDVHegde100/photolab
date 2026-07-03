import type { ProcessedImage } from './types';
import { resizeCanvas, applyCSSFilterToUri } from '../rendering/webCanvas.web';

export type { ProcessedImage } from './types';

export async function applyUnsharpMask(
  uri: string,
  amount: number,
  radius: number
): Promise<ProcessedImage> {
  const blur = Math.max(0.3, radius);
  const a = Math.min(Math.max(amount, 0), 1.5);
  const contrast = 1 + a * 0.35;
  const brightness = 1 + a * 0.02;
  return applyCSSFilterToUri(
    uri,
    `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`
  );
}

export async function applyDenoise(uri: string, strength: number): Promise<ProcessedImage> {
  const t = Math.min(Math.max(strength, 0), 1);
  const blur = 0.4 + t * 1.8;
  return applyCSSFilterToUri(uri, `blur(${blur}px) contrast(${1 + t * 0.08})`);
}

export async function applyAcutance(uri: string, strength: number): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  return applyCSSFilterToUri(uri, `contrast(${1 + s * 0.25}) saturate(${1 + s * 0.05})`);
}

export async function applyAutoColor(uri: string): Promise<ProcessedImage> {
  return applyCSSFilterToUri(uri, 'contrast(1.04) saturate(1.03) brightness(1.01)');
}

export async function applyLowLightRecovery(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  return applyCSSFilterToUri(
    uri,
    `brightness(${1 + s * 0.25}) contrast(${1 - s * 0.05}) saturate(${1 + s * 0.05})`
  );
}

export async function applyPortraitEnhance(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  let current = await applyDenoise(uri, s * 0.35);
  current = await applyAcutance(current.uri, s * 0.45);
  if (s > 0.2) {
    return applyCSSFilterToUri(current.uri, `sepia(${(s * 0.04).toFixed(3)}) brightness(1.02)`);
  }
  return current;
}

export async function applyAnimeCleanup(uri: string, strength: number): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  const smooth = await applyCSSFilterToUri(
    uri,
    `blur(${(s * 0.55).toFixed(2)}px) saturate(${(1 + s * 0.08).toFixed(3)})`
  );
  return applyCSSFilterToUri(
    smooth.uri,
    `contrast(${(1 + s * 0.28).toFixed(3)}) saturate(${(1 + s * 0.06).toFixed(3)})`
  );
}

export async function applyArtifactCleanup(uri: string, strength: number): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  const smooth = await applyCSSFilterToUri(uri, `blur(${(0.25 + s * 0.75).toFixed(2)}px)`);
  return applyCSSFilterToUri(smooth.uri, `contrast(${(1 + s * 0.14).toFixed(3)})`);
}

export async function applyLineArtCleanup(uri: string, strength: number): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  return applyCSSFilterToUri(
    uri,
    `grayscale(${(s * 0.35).toFixed(3)}) contrast(${(1 + s * 0.55).toFixed(3)}) brightness(${(1 + s * 0.03).toFixed(3)})`
  );
}
