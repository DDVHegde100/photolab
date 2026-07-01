import type { ImageRecipe, ExportOptions } from '../core/types';
import { getDisplayUri } from '../core/types';
import { applyColorMatrixToImageData } from './webRenderPipeline.web';
import { computeRenderParams } from './filterPipeline';
import { loadHTMLImage, canvasToBlobUrl } from './webCanvas.web';

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, roundness: number) {
  if (amount <= 0) return;
  const cx = w / 2;
  const cy = h / 2;
  const inner = Math.min(w, h) * (0.3 + roundness * 0.2);
  const outer = Math.max(w, h) * 0.75;
  const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${amount * 0.75})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function parseHex(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgb(${r},${g},${b})`;
}

/** Bake recipe adjustments into pixels via Canvas 2D for web export. */
export async function bakeRecipeToImage(
  recipe: ImageRecipe,
  options: ExportOptions
): Promise<string> {
  const sourceUri = getDisplayUri(recipe);
  const img = await loadHTMLImage(sourceUri);
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (options.scale > 1) {
    w = Math.round(w * options.scale);
    h = Math.round(h * options.scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  const bg = recipe.background;
  if (bg?.enabled && bg.maskUri) {
    const mask = await loadHTMLImage(bg.maskUri);
    switch (bg.type) {
      case 'color':
        ctx.fillStyle = parseHex(bg.color ?? '#FFFFFF');
        ctx.fillRect(0, 0, w, h);
        break;
      case 'gradient': {
        const colors = bg.gradientColors ?? ['#667eea', '#764ba2'];
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1] ?? colors[0]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
      case 'blur':
        ctx.filter = `blur(${2 + (bg.blurAmount ?? 0.6) * 20}px)`;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
        break;
      case 'image':
        if (bg.imageUri) {
          const bgImg = await loadHTMLImage(bg.imageUri);
          ctx.drawImage(bgImg, 0, 0, w, h);
        }
        break;
    }

    const subject = document.createElement('canvas');
    subject.width = w;
    subject.height = h;
    const sctx = subject.getContext('2d')!;
    sctx.drawImage(img, 0, 0, w, h);
    const { colorMatrix } = computeRenderParams(recipe);
    const data = sctx.getImageData(0, 0, w, h);
    applyColorMatrixToImageData(data, colorMatrix);
    sctx.putImageData(data, 0, 0);
    sctx.globalCompositeOperation = 'destination-in';
    sctx.drawImage(mask, 0, 0, w, h);
    ctx.drawImage(subject, 0, 0);
  } else {
    ctx.drawImage(img, 0, 0, w, h);
    const { colorMatrix } = computeRenderParams(recipe);
    const data = ctx.getImageData(0, 0, w, h);
    applyColorMatrixToImageData(data, colorMatrix);
    ctx.putImageData(data, 0, 0);
  }

  drawVignette(ctx, w, h, recipe.finishing.vignetteAmount, recipe.finishing.vignetteRoundness);

  const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = options.format === 'jpeg' ? options.quality : undefined;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Export failed'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      mime,
      quality
    );
  });
}
