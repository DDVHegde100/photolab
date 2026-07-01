import type { BackgroundLayer } from '../core/types';
import type { ProcessedImage } from './types';

/** Web stub — compositing requires native Skia. */
export async function replaceBackground(
  foregroundUri: string,
  _background: BackgroundLayer,
  _options?: { threshold?: number; feather?: number }
): Promise<ProcessedImage & { maskUri: string }> {
  throw new Error('Background replacement is available on iOS and Android only.');
}

export async function compositeBackground(
  foregroundUri: string,
  _maskUri: string,
  _background: BackgroundLayer,
  width: number,
  height: number
): Promise<ProcessedImage> {
  return { uri: foregroundUri, width, height };
}
