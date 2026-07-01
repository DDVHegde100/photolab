import { canvasFromUri, canvasToBlobUrl, loadHTMLImage } from '../rendering/webCanvas.web';

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleCornerBg(data: Uint8ClampedArray, w: number, h: number) {
  const samples: { r: number; g: number; b: number }[] = [];
  const margin = Math.max(2, Math.floor(Math.min(w, h) * 0.02));
  const points = [
    [margin, margin],
    [w - margin - 1, margin],
    [margin, h - margin - 1],
    [w - margin - 1, h - margin - 1],
  ];
  for (const [x, y] of points) {
    const i = (y * w + x) * 4;
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  return {
    r: samples.reduce((s, p) => s + p.r, 0) / samples.length,
    g: samples.reduce((s, p) => s + p.g, 0) / samples.length,
    b: samples.reduce((s, p) => s + p.b, 0) / samples.length,
  };
}

export async function segmentSubject(
  uri: string,
  options: { threshold?: number; feather?: number; invert?: boolean } = {}
): Promise<{ maskUri: string; width: number; height: number }> {
  const { threshold = 42, feather = 12, invert = false } = options;
  const img = await loadHTMLImage(uri);
  const procW = Math.min(640, img.naturalWidth);
  const procH = Math.round(img.naturalHeight * (procW / img.naturalWidth));

  const down = document.createElement('canvas');
  down.width = procW;
  down.height = procH;
  const dctx = down.getContext('2d')!;
  dctx.drawImage(img, 0, 0, procW, procH);
  const src = dctx.getImageData(0, 0, procW, procH);
  const bg = sampleCornerBg(src.data, procW, procH);

  const mask = dctx.createImageData(procW, procH);
  for (let y = 0; y < procH; y++) {
    for (let x = 0; x < procW; x++) {
      const i = (y * procW + x) * 4;
      const dist = colorDistance(src.data[i], src.data[i + 1], src.data[i + 2], bg.r, bg.g, bg.b);
      let alpha = Math.min(255, Math.max(0, ((dist - threshold * 0.5) / threshold) * 255));
      if (invert) alpha = 255 - alpha;
      mask.data[i] = 255;
      mask.data[i + 1] = 255;
      mask.data[i + 2] = 255;
      mask.data[i + 3] = alpha;
    }
  }

  if (feather > 0) {
    for (let pass = 0; pass < 2; pass++) {
      const blurred = new Uint8ClampedArray(mask.data);
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
                sum += mask.data[(ny * procW + nx) * 4 + 3];
                count++;
              }
            }
          }
          blurred[(y * procW + x) * 4 + 3] = Math.round(sum / count);
        }
      }
      mask.data.set(blurred);
    }
  }

  dctx.putImageData(mask, 0, 0);

  const full = document.createElement('canvas');
  full.width = img.naturalWidth;
  full.height = img.naturalHeight;
  const fctx = full.getContext('2d')!;
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = 'high';
  fctx.drawImage(down, 0, 0, full.width, full.height);

  return {
    maskUri: await canvasToBlobUrl(full),
    width: full.width,
    height: full.height,
  };
}

export async function blurBackground(
  uri: string,
  maskUri: string,
  blurAmount: number
): Promise<{ uri: string; width: number; height: number }> {
  const img = await loadHTMLImage(uri);
  const mask = await loadHTMLImage(maskUri);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.filter = `blur(${2 + blurAmount * 18}px)`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  const sharp = document.createElement('canvas');
  sharp.width = w;
  sharp.height = h;
  const sctx = sharp.getContext('2d')!;
  sctx.drawImage(img, 0, 0);
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(mask, 0, 0, w, h);
  ctx.drawImage(sharp, 0, 0);

  const out = await canvasToBlobUrl(canvas);
  return { uri: out, width: w, height: h };
}
