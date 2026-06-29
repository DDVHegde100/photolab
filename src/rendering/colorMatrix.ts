import type { AdjustmentValues } from '../core/types';

/** Build a 4x5 color matrix from adjustment values for Skia ColorMatrix filter */
export function buildColorMatrix(adj: AdjustmentValues): number[] {
  const exposure = Math.pow(2, adj.exposure);
  const contrast = 1 + adj.contrast;
  const contrastOffset = 128 * (1 - contrast);

  const sat = 1 + adj.saturation;
  const vibrance = 1 + adj.vibrance * 0.5;
  const effectiveSat = sat * vibrance;

  const lumR = 0.2126;
  const lumG = 0.7152;
  const lumB = 0.0722;
  const satMatrix = [
    lumR + (1 - lumR) * effectiveSat,
    lumG * (1 - effectiveSat),
    lumB * (1 - effectiveSat),
    0,
    0,
    lumR * (1 - effectiveSat),
    lumG + (1 - lumG) * effectiveSat,
    lumB * (1 - effectiveSat),
    0,
    0,
    lumR * (1 - effectiveSat),
    lumG * (1 - effectiveSat),
    lumB + (1 - lumB) * effectiveSat,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];

  const temp = adj.temperature * 0.01;
  const tint = adj.tint * 0.01;
  const tempMatrix = [
    1 + temp,
    0,
    -temp * 0.5,
    0,
    0,
    0,
    1 + tint * 0.3,
    -tint * 0.3,
    0,
    0,
    -temp * 0.5,
    -tint * 0.3,
    1 - temp,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];

  const highlights = adj.highlights * 0.5;
  const shadows = adj.shadows * 0.5;
  const whites = adj.whites * 0.3;
  const blacks = adj.blacks * 0.3;

  const toneOffset = [
    shadows + blacks,
    shadows + blacks,
    shadows + blacks,
    0,
    highlights + whites,
  ];

  const clarity = 1 + adj.clarity * 0.3;
  const texture = 1 + adj.texture * 0.2;
  const sharpness = 1 + adj.sharpness * 0.15;
  const detailBoost = clarity * texture * sharpness;

  let result = identityMatrix();

  result = multiplyMatrix(result, scaleMatrix(exposure));
  result = multiplyMatrix(result, contrastMatrix(contrast, contrastOffset));
  result = multiplyMatrix(result, satMatrix);
  result = multiplyMatrix(result, tempMatrix);
  result = applyOffset(result, toneOffset);
  result = multiplyMatrix(result, scaleMatrix(detailBoost));

  return result;
}

function identityMatrix(): number[] {
  return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
}

function scaleMatrix(s: number): number[] {
  return [s, 0, 0, 0, 0, 0, s, 0, 0, 0, 0, 0, s, 0, 0, 0, 0, 0, 1, 0];
}

function contrastMatrix(c: number, offset: number): number[] {
  return [c, 0, 0, 0, offset, 0, c, 0, 0, offset, 0, 0, c, 0, offset, 0, 0, 0, 1, 0];
}

function multiplyMatrix(a: number[], b: number[]): number[] {
  const result = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      if (col === 4) {
        sum += a[row * 5 + 4];
      }
      result[row * 5 + col] = sum;
    }
  }
  return result;
}

function applyOffset(matrix: number[], offset: number[]): number[] {
  const result = [...matrix];
  for (let i = 0; i < 3; i++) {
    result[i * 5 + 4] += offset[i] * 255;
  }
  return result;
}

export function curveToLUT(points: { x: number; y: number }[]): number[] {
  const lut = new Array(256);
  const sorted = [...points].sort((a, b) => a.x - b.x);

  for (let i = 0; i < 256; i++) {
    let j = 0;
    while (j < sorted.length - 1 && sorted[j + 1].x < i) j++;

    if (j >= sorted.length - 1) {
      lut[i] = sorted[sorted.length - 1].y / 255;
    } else {
      const t = (i - sorted[j].x) / (sorted[j + 1].x - sorted[j].x || 1);
      lut[i] = (sorted[j].y + t * (sorted[j + 1].y - sorted[j].y)) / 255;
    }
  }

  return lut;
}

export function applyCurveMatrix(
  baseMatrix: number[],
  rgbLUT: number[]
): number[] {
  const avgScale =
    rgbLUT.reduce((sum, v, i) => sum + v * i, 0) / rgbLUT.reduce((s, v) => s + v, 0) / 255;
  return multiplyMatrix(baseMatrix, scaleMatrix(avgScale || 1));
}
