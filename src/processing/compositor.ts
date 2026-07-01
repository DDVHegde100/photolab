import { Skia, FilterMode, MipmapMode, TileMode } from '@shopify/react-native-skia';
import { loadSkiaImage, saveProcessedImage } from './skiaFilters';
import { skiaResize } from './skiaResize';
import type { BackgroundLayer } from '../core/types';
import type { ProcessedImage } from './types';

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export async function compositeBackground(
  foregroundUri: string,
  maskUri: string,
  background: BackgroundLayer,
  width: number,
  height: number
): Promise<ProcessedImage> {
  const fg = await loadSkiaImage(foregroundUri);
  const mask = await loadSkiaImage(maskUri);
  const w = fg.width();
  const h = fg.height();

  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Failed to create composite surface');
  const canvas = surface.getCanvas();

  switch (background.type) {
    case 'color': {
      const c = parseHexColor(background.color ?? '#FFFFFF');
      canvas.clear(Skia.Color(`rgb(${c.r},${c.g},${c.b})`));
      break;
    }
    case 'image': {
      if (background.imageUri) {
        const bg = await loadSkiaImage(background.imageUri);
        canvas.drawImageRectOptions(
          bg,
          Skia.XYWHRect(0, 0, bg.width(), bg.height()),
          Skia.XYWHRect(0, 0, w, h),
          FilterMode.Linear,
          MipmapMode.None,
          Skia.Paint()
        );
      } else {
        canvas.clear(Skia.Color('white'));
      }
      break;
    }
    case 'blur': {
      const sigma = 2 + (background.blurAmount ?? 0.6) * 20;
      const blurPaint = Skia.Paint();
      blurPaint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null));
      canvas.drawImage(fg, 0, 0, blurPaint);
      break;
    }
    case 'gradient': {
      const colors = (background.gradientColors ?? ['#667eea', '#764ba2']).map((c) =>
        Skia.Color(c)
      );
      const shader = Skia.Shader.MakeLinearGradient(
        { x: 0, y: 0 },
        { x: w, y: h },
        colors,
        null,
        TileMode.Clamp
      );
      const paint = Skia.Paint();
      paint.setShader(shader);
      canvas.drawRect(Skia.XYWHRect(0, 0, w, h), paint);
      break;
    }
  }

  const fgPaint = Skia.Paint();
  fgPaint.setAntiAlias(true);
  const maskPaint = Skia.Paint();
  maskPaint.setAntiAlias(true);

  const maskImage = mask;
  canvas.saveLayer();
  canvas.drawImage(fg, 0, 0, fgPaint);

  const dstIn = Skia.Paint();
  dstIn.setBlendMode(5);
  canvas.drawImage(maskImage, 0, 0, dstIn);
  canvas.restore();

  const snapshot = surface.makeImageSnapshot();
  return saveProcessedImage(snapshot, 'composite');
}

export async function replaceBackground(
  foregroundUri: string,
  background: BackgroundLayer,
  options: { threshold?: number; feather?: number } = {}
): Promise<ProcessedImage & { maskUri: string }> {
  const { segmentSubject } = await import('./segmentation');
  const { maskUri, width, height } = await segmentSubject(foregroundUri, {
    threshold: options.threshold ?? 40,
    feather: options.feather ?? 14,
  });

  if (background.type === 'blur') {
    const blurred = await import('./segmentation').then((m) =>
      m.blurBackground(foregroundUri, maskUri, background.blurAmount ?? 0.6)
    );
    return { ...blurred, maskUri };
  }

  const result = await compositeBackground(foregroundUri, maskUri, background, width, height);
  return { ...result, maskUri };
}
