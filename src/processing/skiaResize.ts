import { Skia, FilterMode, MipmapMode, ImageFormat } from '@shopify/react-native-skia';
import { loadSkiaImage, saveProcessedImage } from './skiaFilters';
import type { ProcessedImage } from './types';

/**
 * GPU-accelerated resize using Skia cubic sampling — significantly sharper
 * than expo-image-manipulator for upscaling passes.
 */
export async function skiaResize(
  uri: string,
  targetW: number,
  targetH: number,
  suffix = 'resize'
): Promise<ProcessedImage> {
  const image = await loadSkiaImage(uri);
  const srcW = image.width();
  const srcH = image.height();

  const surface = Skia.Surface.Make(targetW, targetH);
  if (!surface) throw new Error('Failed to create resize surface');

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));

  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  const srcRect = Skia.XYWHRect(0, 0, srcW, srcH);
  const dstRect = Skia.XYWHRect(0, 0, targetW, targetH);

  canvas.drawImageRectOptions(
    image,
    srcRect,
    dstRect,
    FilterMode.Linear,
    MipmapMode.Linear,
    paint
  );

  const snapshot = surface.makeImageSnapshot();
  return saveProcessedImage(snapshot, suffix);
}

/** Progressive 2× upscale until target dimensions are reached. */
export async function skiaProgressiveResize(
  uri: string,
  width: number,
  height: number,
  targetW: number,
  targetH: number,
  onStep?: (step: number, total: number) => void
): Promise<ProcessedImage> {
  let currentUri = uri;
  let currentW = width;
  let currentH = height;

  const stepsNeeded = Math.max(
    Math.ceil(Math.log2(targetW / width)),
    Math.ceil(Math.log2(targetH / height))
  );
  let step = 0;

  while (currentW < targetW || currentH < targetH) {
    step++;
    onStep?.(step, stepsNeeded + 1);

    const nextW = Math.min(currentW * 2, targetW);
    const nextH = Math.min(currentH * 2, targetH);
    const result = await skiaResize(currentUri, nextW, nextH, `up-${step}`);
    currentUri = result.uri;
    currentW = result.width;
    currentH = result.height;
  }

  if (currentW !== targetW || currentH !== targetH) {
    step++;
    onStep?.(step, stepsNeeded + 1);
    return skiaResize(currentUri, targetW, targetH, 'up-final');
  }

  return { uri: currentUri, width: currentW, height: currentH };
}

export async function probeImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  const image = await loadSkiaImage(uri);
  return { width: image.width(), height: image.height() };
}
