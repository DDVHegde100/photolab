import type { ImageRecipe } from '../core/types';
import { computeRenderParams } from './filterPipeline';
import { canvasToBlobUrl, loadHTMLImage } from './webCanvas.web';

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

/** Apply Skia-style 4×5 row-major color matrix to RGBA ImageData. */
export function applyColorMatrixToImageData(data: ImageData, matrix: number[]): void {
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    d[i] = clamp(r * matrix[0] + g * matrix[1] + b * matrix[2] + matrix[4]);
    d[i + 1] = clamp(r * matrix[5] + g * matrix[6] + b * matrix[7] + matrix[9]);
    d[i + 2] = clamp(r * matrix[10] + g * matrix[11] + b * matrix[12] + matrix[14]);
  }
}

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

function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount * 40;
    d[i] = clamp(d[i] + noise);
    d[i + 1] = clamp(d[i + 1] + noise);
    d[i + 2] = clamp(d[i + 2] + noise);
  }
  ctx.putImageData(imgData, 0, 0);
}

function drawFade(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  ctx.fillStyle = `rgba(240,235,225,${amount * 0.45})`;
  ctx.fillRect(0, 0, w, h);
}

export interface RenderLayout {
  offsetX: number;
  offsetY: number;
  drawW: number;
  drawH: number;
}

export function computeFitLayout(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number
): RenderLayout {
  const fitScale = Math.min(canvasW / imgW, canvasH / imgH);
  const drawW = imgW * fitScale;
  const drawH = imgH * fitScale;
  return {
    offsetX: (canvasW - drawW) / 2,
    offsetY: (canvasH - drawH) / 2,
    drawW,
    drawH,
  };
}

/** Render recipe adjustments onto a canvas (base image layer). */
export async function renderRecipeBaseLayer(
  recipe: ImageRecipe,
  sourceUri: string,
  canvasW: number,
  canvasH: number,
  maxPixels = 1_600_000
): Promise<{ canvas: HTMLCanvasElement; layout: RenderLayout }> {
  const img = await loadHTMLImage(sourceUri);
  let srcW = img.naturalWidth;
  let srcH = img.naturalHeight;

  const scale = Math.min(1, Math.sqrt(maxPixels / (srcW * srcH)));
  if (scale < 1) {
    srcW = Math.round(srcW * scale);
    srcH = Math.round(srcH * scale);
  }

  const layout = computeFitLayout(srcW, srcH, canvasW, canvasH);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const offscreen = document.createElement('canvas');
  offscreen.width = srcW;
  offscreen.height = srcH;
  const octx = offscreen.getContext('2d');
  if (!octx) throw new Error('Canvas 2D not supported');

  octx.drawImage(img, 0, 0, srcW, srcH);

  const { colorMatrix } = computeRenderParams(recipe);
  const imageData = octx.getImageData(0, 0, srcW, srcH);
  applyColorMatrixToImageData(imageData, colorMatrix);
  octx.putImageData(imageData, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(offscreen, layout.offsetX, layout.offsetY, layout.drawW, layout.drawH);

  drawVignette(ctx, canvasW, canvasH, recipe.finishing.vignetteAmount, recipe.finishing.vignetteRoundness);
  drawGrain(ctx, canvasW, canvasH, recipe.finishing.grainAmount);
  drawFade(ctx, canvasW, canvasH, recipe.finishing.fadeAmount);

  if (recipe.tiltShift.enabled && recipe.tiltShift.blurAmount > 0) {
    const center = layout.offsetY + recipe.tiltShift.centerY * layout.drawH;
    const half = (recipe.tiltShift.bandSize * layout.drawH) / 2;
    ctx.fillStyle = `rgba(255,255,255,${recipe.tiltShift.blurAmount * 0.06})`;
    ctx.fillRect(0, 0, canvasW, center - half);
    ctx.fillRect(0, center + half, canvasW, canvasH - center - half);
  }

  return { canvas, layout };
}

export async function renderRecipeToBlobUrl(
  recipe: ImageRecipe,
  sourceUri: string,
  width: number,
  height: number
): Promise<string> {
  const { canvas } = await renderRecipeBaseLayer(recipe, sourceUri, width, height, 4_000_000);
  return canvasToBlobUrl(canvas);
}

export async function bakeRecipeForExport(
  recipe: ImageRecipe,
  sourceUri: string,
  scale: number
): Promise<string> {
  const img = await loadHTMLImage(sourceUri);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  return renderRecipeToBlobUrl(recipe, sourceUri, w, h);
}
