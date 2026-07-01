import type { ProcessedImage } from './types';
import { progressiveUpscale as nativeUpscale, probeImageDimensions } from './upscaler';
import type { UpscaleFactor, UpscaleQuality, UpscaleOptions } from './upscaler';

export type { UpscaleFactor, UpscaleQuality, UpscaleOptions };
export { probeImageDimensions };

export async function progressiveUpscale(
  uri: string,
  width: number,
  height: number,
  options: UpscaleOptions
): Promise<ProcessedImage> {
  return nativeUpscale(uri, width, height, options);
}
