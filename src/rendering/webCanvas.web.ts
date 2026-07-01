import type { AdjustmentValues } from '../core/types';

/** Approximate adjustment stack as CSS filters for web preview */
export function adjustmentsToCSSFilter(adj: AdjustmentValues): string {
  const brightness = Math.pow(2, adj.exposure);
  const contrast = 1 + adj.contrast;
  const saturate = Math.max(0, 1 + adj.saturation + adj.vibrance * 0.5);
  const warmth = 1 + adj.temperature * 0.002;
  const sharpness = 1 + adj.sharpness * 0.15 + adj.clarity * 0.1;

  return [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    `sepia(${(warmth - 1).toFixed(3)})`,
    sharpness > 1.01 ? `contrast(${(contrast * sharpness).toFixed(3)})` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function loadHTMLImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = uri;
  });
}

export async function canvasFromUri(uri: string): Promise<HTMLCanvasElement> {
  const img = await loadHTMLImage(uri);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export canvas'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      'image/png',
      1
    );
  });
}

export async function resizeCanvas(
  uri: string,
  targetWidth: number,
  quality: 'high' | 'medium' = 'high'
): Promise<{ uri: string; width: number; height: number }> {
  const img = await loadHTMLImage(uri);
  const aspect = img.naturalHeight / img.naturalWidth;
  const width = targetWidth;
  const height = Math.round(targetWidth * aspect);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = quality;
  ctx.drawImage(img, 0, 0, width, height);

  const outUri = await canvasToBlobUrl(canvas);
  return { uri: outUri, width, height };
}

export async function applyCSSFilterToUri(
  uri: string,
  filter: string
): Promise<{ uri: string; width: number; height: number }> {
  const img = await loadHTMLImage(uri);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.filter = filter;
  ctx.drawImage(img, 0, 0);

  const outUri = await canvasToBlobUrl(canvas);
  return { uri: outUri, width: canvas.width, height: canvas.height };
}
