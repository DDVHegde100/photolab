import { Skia, ImageFormat, TileMode, FilterMode } from '@shopify/react-native-skia';
import { File, Directory, Paths } from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

import type { ProcessedImage } from './types';

export type { ProcessedImage } from './types';

function getProcessedDir(): Directory {
  const dir = new Directory(Paths.document, 'processed');
  if (!dir.exists) dir.create();
  return dir;
}

export async function loadSkiaImage(uri: string) {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Failed to decode image');
  return image;
}

export async function saveProcessedImage(
  image: ReturnType<typeof Skia.Image.MakeImageFromEncoded>,
  suffix: string
): Promise<ProcessedImage> {
  if (!image) throw new Error('No image to save');

  const bytes = image.encodeToBytes(ImageFormat.PNG, 100);
  const filename = `${uuidv4()}_${suffix}.png`;
  const file = new File(getProcessedDir(), filename);
  if (!file.exists) file.create();
  file.write(bytes);

  return {
    uri: file.uri,
    width: image.width(),
    height: image.height(),
  };
}

export async function applyImageFilter(
  uri: string,
  buildFilter: () => ReturnType<typeof Skia.ImageFilter.MakeBlur>,
  suffix: string
): Promise<ProcessedImage> {
  const image = await loadSkiaImage(uri);
  const w = image.width();
  const h = image.height();

  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Failed to create surface');

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setImageFilter(buildFilter());
  canvas.drawImage(image, 0, 0, paint);

  const snapshot = surface.makeImageSnapshot();
  return saveProcessedImage(snapshot, suffix);
}

/** Unsharp mask: original + amount × (original − blurred) */
export async function applyUnsharpMask(
  uri: string,
  amount: number,
  radius: number
): Promise<ProcessedImage> {
  const sigma = Math.max(0.3, radius);
  const a = Math.min(Math.max(amount, 0), 1.5);

  return applyImageFilter(
    uri,
    () => {
      const blur = Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null);
      return Skia.ImageFilter.MakeArithmetic(0, 1 + a, -a, 0, true, blur, null);
    },
    'sharp'
  );
}

/** Edge-preserving denoise: mix(sharp, blur, strength) */
export async function applyDenoise(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const t = Math.min(Math.max(strength, 0), 1);
  const sigma = 0.5 + t * 2.5;

  return applyImageFilter(
    uri,
    () => {
      const blur = Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null);
      return Skia.ImageFilter.MakeArithmetic(0, 1 - t, t, 0, true, blur, null);
    },
    'denoise'
  );
}

/** Subtle acutance boost via 3×3 convolution kernel */
export async function applyAcutance(uri: string, strength: number): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1) * 0.6;
  const center = 1 + 4 * s;
  const edge = -s;

  return applyImageFilter(
    uri,
    () =>
      Skia.ImageFilter.MakeMatrixConvolution(
        3,
        3,
        [0, edge, 0, edge, center, edge, 0, edge, 0],
        1,
        0,
        1,
        1,
        TileMode.Clamp,
        false,
        null
      ),
    'acutance'
  );
}

/** Auto white-balance via subtle warmth/neutral correction */
export async function applyAutoColor(uri: string): Promise<ProcessedImage> {
  return applyImageFilter(
    uri,
    () => {
      const matrix = Skia.ColorFilter.MakeMatrix([
        1.02, 0, 0, 0, 0,
        0, 1.0, 0, 0, 0,
        0, 0, 0.98, 0, 0,
        0, 0, 0, 1, 0,
      ]);
      return Skia.ImageFilter.MakeColorFilter(matrix, null);
    },
    'autocolor'
  );
}

/** Shadow lift for low-light recovery */
export async function applyLowLightRecovery(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  const lift = s * 18;
  const shadowOpen = s * 0.12;

  return applyImageFilter(
    uri,
    () => {
      const matrix = Skia.ColorFilter.MakeMatrix([
        1 + shadowOpen * 0.3, 0, 0, 0, lift,
        0, 1 + shadowOpen * 0.3, 0, 0, lift,
        0, 0, 1 + shadowOpen * 0.2, 0, lift * 0.9,
        0, 0, 0, 1, 0,
      ]);
      return Skia.ImageFilter.MakeColorFilter(matrix, null);
    },
    'lowlight'
  );
}

/** Portrait polish: mild denoise + acutance + warmth */
export async function applyPortraitEnhance(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  let current = uri;

  const denoised = await applyDenoise(current, s * 0.35);
  current = denoised.uri;

  const sharpened = await applyAcutance(current, s * 0.45);
  current = sharpened.uri;

  if (s > 0.2) {
    const warmed = await applyImageFilter(
      current,
      () => {
        const matrix = Skia.ColorFilter.MakeMatrix([
          1.01, 0, 0, 0, 2 * s,
          0, 1.0, 0, 0, s,
          0, 0, 0.99, 0, 0,
          0, 0, 0, 1, 0,
        ]);
        return Skia.ImageFilter.MakeColorFilter(matrix, null);
      },
      'portrait'
    );
    return warmed;
  }

  return { uri: current, width: sharpened.width, height: sharpened.height };
}

/** Illustration cleanup: smooth flat color regions while keeping ink edges crisp. */
export async function applyAnimeCleanup(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  let current = uri;

  const smoothed = await applyDenoise(current, s * 0.45);
  current = smoothed.uri;

  const edged = await applyAcutance(current, s * 0.72);
  current = edged.uri;

  return applyImageFilter(
    current,
    () => {
      const matrix = Skia.ColorFilter.MakeMatrix([
        1 + s * 0.08, 0, 0, 0, -s * 3,
        0, 1 + s * 0.08, 0, 0, -s * 3,
        0, 0, 1 + s * 0.08, 0, -s * 3,
        0, 0, 0, 1, 0,
      ]);
      return Skia.ImageFilter.MakeColorFilter(matrix, null);
    },
    'anime-clean'
  );
}

/** Compression cleanup: soften block noise, then restore usable edge contrast. */
export async function applyArtifactCleanup(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  const denoised = await applyDenoise(uri, s * 0.55);
  return applyUnsharpMask(denoised.uri, s * 0.35, 0.8);
}

/** Line-art mode for scans, manga panels, UI screenshots, and text-heavy images. */
export async function applyLineArtCleanup(
  uri: string,
  strength: number
): Promise<ProcessedImage> {
  const s = Math.min(Math.max(strength, 0), 1);
  const edged = await applyAcutance(uri, s);
  return applyImageFilter(
    edged.uri,
    () => {
      const c = 1 + s * 0.22;
      const o = -s * 10;
      const matrix = Skia.ColorFilter.MakeMatrix([
        c, 0, 0, 0, o,
        0, c, 0, 0, o,
        0, 0, c, 0, o,
        0, 0, 0, 1, 0,
      ]);
      return Skia.ImageFilter.MakeColorFilter(matrix, null);
    },
    'line-art'
  );
}

export { FilterMode, TileMode };
