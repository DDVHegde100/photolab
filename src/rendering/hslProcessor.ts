import type { HSLAdjustments, ColorGrade } from '../core/types';

const HSL_CHANNEL_RANGES: Record<keyof HSLAdjustments, [number, number]> = {
  red: [0, 30],
  orange: [15, 45],
  yellow: [40, 70],
  green: [75, 165],
  aqua: [160, 200],
  blue: [195, 250],
  purple: [245, 290],
  magenta: [285, 345],
};

export function hslToColorMatrix(hsl: HSLAdjustments): number[] {
  let hueShift = 0;
  let satBoost = 0;
  let lumShift = 0;
  let count = 0;

  for (const [channel, range] of Object.entries(HSL_CHANNEL_RANGES)) {
    const ch = hsl[channel as keyof HSLAdjustments];
    if (ch.hue !== 0 || ch.saturation !== 0 || ch.luminance !== 0) {
      hueShift += ch.hue * ((range[0] + range[1]) / 2 / 360);
      satBoost += ch.saturation;
      lumShift += ch.luminance;
      count++;
    }
  }

  if (count === 0) {
    return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  }

  const avgSat = 1 + satBoost / count;
  const avgLum = lumShift / count * 0.3;

  return [
    avgSat, hueShift * 0.1, 0, 0, avgLum * 255,
    0, avgSat, hueShift * 0.1, 0, avgLum * 255,
    hueShift * 0.1, 0, avgSat, 0, avgLum * 255,
    0, 0, 0, 1, 0,
  ];
}

export function colorGradeToMatrix(grade: ColorGrade): number[] {
  const { shadows, midtones, highlights, balance } = grade;

  const shadowWeight = Math.max(0, 0.5 - balance * 0.01);
  const highlightWeight = Math.max(0, 0.5 + balance * 0.01);
  const midWeight = 1 - shadowWeight - highlightWeight;

  const r =
    shadows.luminance * shadowWeight +
    midtones.luminance * midWeight +
    highlights.luminance * highlightWeight;
  const g =
    shadows.saturation * shadowWeight * 0.3 +
    midtones.saturation * midWeight * 0.3 +
    highlights.saturation * highlightWeight * 0.3;
  const b =
    shadows.hue * shadowWeight * 0.01 +
    midtones.hue * midWeight * 0.01 +
    highlights.hue * highlightWeight * 0.01;

  return [
    1 + g, b, 0, 0, r * 30,
    0, 1 + g, b, 0, r * 30,
    b, 0, 1 + g, 0, r * 30,
    0, 0, 0, 1, 0,
  ];
}

export const HSL_CHANNELS: (keyof HSLAdjustments)[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'aqua',
  'blue',
  'purple',
  'magenta',
];

export const HSL_CHANNEL_COLORS: Record<keyof HSLAdjustments, string> = {
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  aqua: '#5AC8FA',
  blue: '#007AFF',
  purple: '#AF52DE',
  magenta: '#FF2D55',
};
