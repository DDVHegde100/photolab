import { Skia, TileMode, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { loadSkiaImage, saveProcessedImage } from './skiaFilters';
import type { HealSpot } from '../core/types';
import type { ProcessedImage } from './types';

/**
 * Spot heal via surrounding-area blur blend — fast approximation of
 * content-aware fill for small blemishes and dust spots.
 */
export async function applySpotHeal(
  uri: string,
  spots: HealSpot[]
): Promise<ProcessedImage> {
  const active = spots.filter((s) => !s.healed);
  if (active.length === 0) return { uri, width: 0, height: 0 };

  let current = uri;
  for (const spot of active) {
    current = await healSingleSpot(current, spot);
  }

  const image = await loadSkiaImage(current);
  return { uri: current, width: image.width(), height: image.height() };
}

async function healSingleSpot(uri: string, spot: HealSpot): Promise<string> {
  const image = await loadSkiaImage(uri);
  const w = image.width();
  const h = image.height();
  const px = Math.round(spot.x * w);
  const py = Math.round(spot.y * h);
  const r = Math.max(4, Math.round(spot.radius * Math.min(w, h)));

  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Failed to create heal surface');
  const canvas = surface.getCanvas();

  canvas.drawImage(image, 0, 0);

  const blurPaint = Skia.Paint();
  const sigma = r * 0.8;
  blurPaint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null));

  const patchSize = r * 3;
  const srcRect = Skia.XYWHRect(
    Math.max(0, px - patchSize),
    Math.max(0, py - patchSize),
    Math.min(patchSize * 2, w),
    Math.min(patchSize * 2, h)
  );
  const dstRect = Skia.XYWHRect(srcRect.x, srcRect.y, srcRect.width, srcRect.height);

  canvas.save();
  canvas.clipRect(Skia.XYWHRect(px - r, py - r, r * 2, r * 2), 1, true);
  canvas.drawImageRectOptions(image, srcRect, dstRect, FilterMode.Linear, MipmapMode.None, blurPaint);
  canvas.restore();

  const result = await saveProcessedImage(surface.makeImageSnapshot(), 'heal');
  return result.uri;
}
