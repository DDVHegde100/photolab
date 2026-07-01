import { loadHTMLImage, canvasToBlobUrl } from '../rendering/webCanvas.web';
import type { HealSpot } from '../core/types';
import type { ProcessedImage } from './types';

export async function applySpotHeal(uri: string, spots: HealSpot[]): Promise<ProcessedImage> {
  const active = spots.filter((s) => !s.healed);
  if (active.length === 0) return { uri, width: 0, height: 0 };

  let current = uri;
  for (const spot of active) {
    current = await healSingleSpot(current, spot);
  }

  const img = await loadHTMLImage(current);
  return { uri: current, width: img.naturalWidth, height: img.naturalHeight };
}

async function healSingleSpot(uri: string, spot: HealSpot): Promise<string> {
  const img = await loadHTMLImage(uri);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const px = Math.round(spot.x * w);
  const py = Math.round(spot.y * h);
  const r = Math.max(4, Math.round(spot.radius * Math.min(w, h)));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = `blur(${r * 0.6}px)`;
  const patch = Math.max(r * 3, 20);
  ctx.drawImage(
    img,
    Math.max(0, px - patch),
    Math.max(0, py - patch),
    patch * 2,
    patch * 2,
    Math.max(0, px - patch),
    Math.max(0, py - patch),
    patch * 2,
    patch * 2
  );
  ctx.restore();

  return canvasToBlobUrl(canvas);
}
