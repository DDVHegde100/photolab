import { Skia, ImageFormat, FilterMode, MipmapMode, TileMode } from '@shopify/react-native-skia';
import { File, Directory, Paths } from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import { loadSkiaImage, saveProcessedImage } from './skiaFilters';
import { skiaResize } from './skiaResize';
import type { ProcessedImage } from './types';

function getMaskDir(): Directory {
  const dir = new Directory(Paths.document, 'masks');
  if (!dir.exists) dir.create();
  return dir;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleCornerBg(
  pixels: Uint8Array,
  w: number,
  h: number
): { r: number; g: number; b: number } {
  const samples: { r: number; g: number; b: number }[] = [];
  const margin = Math.max(2, Math.floor(Math.min(w, h) * 0.02));
  const points = [
    [margin, margin],
    [w - margin - 1, margin],
    [margin, h - margin - 1],
    [w - margin - 1, h - margin - 1],
    [Math.floor(w / 2), margin],
    [Math.floor(w / 2), h - margin - 1],
  ];

  for (const [x, y] of points) {
    const i = (y * w + x) * 4;
    samples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
  }

  return {
    r: samples.reduce((s, p) => s + p.r, 0) / samples.length,
    g: samples.reduce((s, p) => s + p.g, 0) / samples.length,
    b: samples.reduce((s, p) => s + p.b, 0) / samples.length,
  };
}

export interface SegmentationOptions {
  threshold?: number;
  feather?: number;
  invert?: boolean;
}

/**
 * Auto-segment subject from background using corner color sampling.
 * Works best on portraits and products with distinct backgrounds.
 */
export async function segmentSubject(
  uri: string,
  options: SegmentationOptions = {}
): Promise<{ maskUri: string; width: number; height: number }> {
  const { threshold = 42, feather = 12, invert = false } = options;

  const image = await loadSkiaImage(uri);
  const fullW = image.width();
  const fullH = image.height();

  const procW = Math.min(640, fullW);
  const procH = Math.round(fullH * (procW / fullW));

  const downscaled = await skiaResize(uri, procW, procH, 'seg-down');
  const procImage = await loadSkiaImage(downscaled.uri);
  const pixels = procImage.readPixels(0, 0, {
    width: procW,
    height: procH,
    colorType: 4, // RGBA_8888
    alphaType: 1,
  }) as Uint8Array | null;

  if (!pixels) throw new Error('Failed to read image pixels for segmentation');

  const bg = sampleCornerBg(pixels, procW, procH);
  const maskData = new Uint8Array(procW * procH * 4);

  for (let y = 0; y < procH; y++) {
    for (let x = 0; x < procW; x++) {
      const i = (y * procW + x) * 4;
      const dist = colorDistance(pixels[i], pixels[i + 1], pixels[i + 2], bg.r, bg.g, bg.b);
      let alpha = Math.min(255, Math.max(0, ((dist - threshold * 0.5) / threshold) * 255));
      if (invert) alpha = 255 - alpha;
      maskData[i] = 255;
      maskData[i + 1] = 255;
      maskData[i + 2] = 255;
      maskData[i + 3] = alpha;
    }
  }

  if (feather > 0) {
    for (let pass = 0; pass < 2; pass++) {
      const blurred = new Uint8Array(maskData);
      const r = Math.ceil(feather / 3);
      for (let y = 0; y < procH; y++) {
        for (let x = 0; x < procW; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < procW && ny >= 0 && ny < procH) {
                sum += maskData[(ny * procW + nx) * 4 + 3];
                count++;
              }
            }
          }
          blurred[(y * procW + x) * 4 + 3] = Math.round(sum / count);
        }
      }
      maskData.set(blurred);
    }
  }

  const maskImage = Skia.Image.MakeImage(
    { width: procW, height: procH, colorType: 4, alphaType: 1 },
    Skia.Data.fromBytes(maskData),
    procW * 4
  );
  if (!maskImage) throw new Error('Failed to create mask image');

  const fullMaskSurface = Skia.Surface.Make(fullW, fullH);
  if (!fullMaskSurface) throw new Error('Failed to upscale mask');
  const canvas = fullMaskSurface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  canvas.drawImageRectOptions(
    maskImage,
    Skia.XYWHRect(0, 0, procW, procH),
    Skia.XYWHRect(0, 0, fullW, fullH),
    FilterMode.Linear,
    MipmapMode.None,
    paint
  );

  const fullMask = fullMaskSurface.makeImageSnapshot();
  const bytes = fullMask.encodeToBytes(ImageFormat.PNG, 100);
  const filename = `${uuidv4()}_mask.png`;
  const file = new File(getMaskDir(), filename);
  if (!file.exists) file.create();
  file.write(bytes);

  return { maskUri: file.uri, width: fullW, height: fullH };
}

export async function blurBackground(
  uri: string,
  maskUri: string,
  blurAmount: number
): Promise<ProcessedImage> {
  const sigma = 2 + blurAmount * 18;
  const fg = await loadSkiaImage(uri);
  const mask = await loadSkiaImage(maskUri);
  const w = fg.width();
  const h = fg.height();

  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Failed to create composite surface');
  const canvas = surface.getCanvas();

  const blurPaint = Skia.Paint();
  blurPaint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null));
  canvas.drawImage(fg, 0, 0, blurPaint);

  const fgPaint = Skia.Paint();
  fgPaint.setBlendMode(1);
  canvas.drawImage(fg, 0, 0, fgPaint);

  return saveProcessedImage(surface.makeImageSnapshot(), 'bg-blur');
}
