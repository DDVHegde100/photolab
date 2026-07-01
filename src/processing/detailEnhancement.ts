import { Skia, TileMode } from '@shopify/react-native-skia';
import { applyImageFilter, applyUnsharpMask, loadSkiaImage, saveProcessedImage } from './skiaFilters';
import type { ProcessedImage } from './types';

/** Luminance-only unsharp mask — avoids color halos on edges. */
export async function applyLuminanceSharpen(
  uri: string,
  amount: number,
  radius: number
): Promise<ProcessedImage> {
  const sigma = Math.max(0.4, radius);
  const a = Math.min(Math.max(amount, 0), 1.2);

  return applyImageFilter(
    uri,
    () => {
      const blur = Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null);
      const lumToAlpha = Skia.ColorFilter.MakeMatrix([
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0.2126, 0.7152, 0.0722, 0, 0,
      ]);
      const sharpen = Skia.ImageFilter.MakeArithmetic(0, 1 + a, -a, 0, true, blur, null);
      const lumSharpen = Skia.ImageFilter.MakeColorFilter(lumToAlpha, sharpen);
      return lumSharpen;
    },
    'lum-sharp'
  );
}

/** Local contrast boost (micro-detail) via high-frequency overlay. */
export async function applyLocalContrast(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1) * 0.45;

  return applyImageFilter(
    uri,
    () => {
      const blur = Skia.ImageFilter.MakeBlur(8, 8, TileMode.Clamp, null);
      return Skia.ImageFilter.MakeArithmetic(1 + s, -s, 0, 0, true, blur, null);
    },
    'local-contrast'
  );
}

/** Edge-adaptive detail recovery — strong on edges, gentle on flat areas. */
export async function applyEdgeAdaptiveDetail(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);

  const acutance = await applyImageFilter(
    uri,
    () =>
      Skia.ImageFilter.MakeMatrixConvolution(
        3,
        3,
        [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0],
        1,
        0,
        1,
        1,
        TileMode.Clamp,
        false,
        null
      ),
    'edge-detail'
  );

  if (s < 0.35) return acutance;

  return applyImageFilter(
    acutance.uri,
    () => {
      const blur = Skia.ImageFilter.MakeBlur(1.2, 1.2, TileMode.Clamp, null);
      return Skia.ImageFilter.MakeArithmetic(0, 1 - s * 0.15, s * 0.15, 0, true, blur, null);
    },
    'edge-smooth'
  );
}

/** Light pre-upscale denoise to prevent amplifying sensor noise. */
export async function applyPreUpscaleDenoise(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const t = Math.min(Math.max(strength, 0), 1) * 0.35;
  const sigma = 0.4 + t * 1.2;

  return applyImageFilter(
    uri,
    () => {
      const blur = Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null);
      return Skia.ImageFilter.MakeArithmetic(0, 1 - t, t, 0, true, blur, null);
    },
    'pre-denoise'
  );
}

/** Full post-upscale finishing pass — the "high-res camera" look. */
export async function applyUpscaleFinish(
  uri: string,
  targetW: number,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  const radius = Math.max(0.6, Math.min(2.0, targetW / 2400));

  let current = uri;

  const denoised = await applyPreUpscaleDenoise(current, s * 0.25);
  current = denoised.uri;

  const local = await applyLocalContrast(current, s * 0.7);
  current = local.uri;

  const edge = await applyEdgeAdaptiveDetail(current, s);
  current = edge.uri;

  const sharp = await applyLuminanceSharpen(current, s * 0.65, radius);
  return sharp;
}

/** Subtle clarity boost mimicking larger sensor micro-contrast. */
export async function applyClarityBoost(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const image = await loadSkiaImage(uri);
  const w = image.width();
  const h = image.height();

  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Failed to create surface');

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  const s = Math.min(Math.max(strength, 0), 1);
  const matrix = Skia.ColorFilter.MakeMatrix([
    1 + s * 0.08, 0, 0, 0, -s * 4,
    0, 1 + s * 0.08, 0, 0, -s * 4,
    0, 0, 1 + s * 0.08, 0, -s * 4,
    0, 0, 0, 1, 0,
  ]);
  paint.setColorFilter(matrix);
  canvas.drawImage(image, 0, 0, paint);

  return saveProcessedImage(surface.makeImageSnapshot(), 'clarity');
}
