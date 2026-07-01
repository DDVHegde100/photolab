import type { BackgroundLayer } from '../core/types';
import type { ProcessedImage } from './types';
import { loadHTMLImage, canvasToBlobUrl } from '../rendering/webCanvas.web';
import { segmentSubject } from './segmentation.web';

function parseHex(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgb(${r},${g},${b})`;
}

async function compositeBackground(
  foregroundUri: string,
  maskUri: string,
  background: BackgroundLayer
): Promise<ProcessedImage> {
  const fg = await loadHTMLImage(foregroundUri);
  const mask = await loadHTMLImage(maskUri);
  const w = fg.naturalWidth;
  const h = fg.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  switch (background.type) {
    case 'color':
      ctx.fillStyle = parseHex(background.color ?? '#FFFFFF');
      ctx.fillRect(0, 0, w, h);
      break;
    case 'gradient': {
      const colors = background.gradientColors ?? ['#667eea', '#764ba2'];
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1] ?? colors[0]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'blur':
      ctx.filter = `blur(${2 + (background.blurAmount ?? 0.6) * 20}px)`;
      ctx.drawImage(fg, 0, 0);
      ctx.filter = 'none';
      break;
    case 'image':
      if (background.imageUri) {
        const bg = await loadHTMLImage(background.imageUri);
        ctx.drawImage(bg, 0, 0, w, h);
      }
      break;
  }

  const subject = document.createElement('canvas');
  subject.width = w;
  subject.height = h;
  const sctx = subject.getContext('2d')!;
  sctx.drawImage(fg, 0, 0);
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(mask, 0, 0, w, h);
  ctx.drawImage(subject, 0, 0);

  const uri = await canvasToBlobUrl(canvas);
  return { uri, width: w, height: h };
}

export async function replaceBackground(
  foregroundUri: string,
  background: BackgroundLayer,
  options: { threshold?: number; feather?: number } = {}
): Promise<ProcessedImage & { maskUri: string }> {
  const { maskUri } = await segmentSubject(foregroundUri, {
    threshold: options.threshold ?? 40,
    feather: options.feather ?? 14,
  });

  if (background.type === 'blur') {
    const { blurBackground } = await import('./segmentation.web');
    const blurred = await blurBackground(foregroundUri, maskUri, background.blurAmount ?? 0.6);
    return { ...blurred, maskUri };
  }

  const result = await compositeBackground(foregroundUri, maskUri, background);
  return { ...result, maskUri };
}
