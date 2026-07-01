import type { SplitTone } from '../core/types';

function hueToRgb(hue: number, sat: number): [number, number, number] {
  const h = (hue % 360) / 60;
  const s = Math.min(Math.max(sat, 0), 1) * 0.35;
  const c = s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (h < 1) { r = c; g = x; }
  else if (h < 2) { r = x; g = c; }
  else if (h < 3) { g = c; b = x; }
  else if (h < 4) { g = x; b = c; }
  else if (h < 5) { r = x; b = c; }
  else { r = c; b = x; }
  return [1 + r * 0.15, 1 + g * 0.15, 1 + b * 0.15];
}

/** Build split-tone color matrix for shadow/highlight tinting. */
export function splitToneToMatrix(tone: SplitTone): number[] {
  const balance = tone.balance / 100;
  const shadowStr = tone.shadowSaturation / 100;
  const highlightStr = tone.highlightSaturation / 100;

  const [sr, sg, sb] = hueToRgb(tone.shadowHue, shadowStr);
  const [hr, hg, hb] = hueToRgb(tone.highlightHue, highlightStr);

  const shadowWeight = 0.5 - balance * 0.3;
  const highlightWeight = 0.5 + balance * 0.3;

  const rScale = sr * shadowWeight + hr * highlightWeight;
  const gScale = sg * shadowWeight + hg * highlightWeight;
  const bScale = sb * shadowWeight + hb * highlightWeight;

  const rOff = shadowStr * 4 * shadowWeight - highlightStr * 2 * highlightWeight;
  const bOff = shadowStr * -2 * shadowWeight + highlightStr * 4 * highlightWeight;

  return [
    rScale, 0, 0, 0, rOff,
    0, gScale, 0, 0, 0,
    0, 0, bScale, 0, bOff,
    0, 0, 0, 1, 0,
  ];
}
