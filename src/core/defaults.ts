import type {
  AdjustmentValues,
  ColorGrade,
  CurveData,
  CurvePoint,
  HSLAdjustments,
  HSLChannel,
} from './types';

const defaultChannel = (): HSLChannel => ({
  hue: 0,
  saturation: 0,
  luminance: 0,
});

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  clarity: 0,
  texture: 0,
  sharpness: 0,
};

export const DEFAULT_HSL: HSLAdjustments = {
  red: defaultChannel(),
  orange: defaultChannel(),
  yellow: defaultChannel(),
  green: defaultChannel(),
  aqua: defaultChannel(),
  blue: defaultChannel(),
  purple: defaultChannel(),
  magenta: defaultChannel(),
};

export const DEFAULT_COLOR_GRADE: ColorGrade = {
  shadows: { hue: 0, saturation: 0, luminance: 0 },
  midtones: { hue: 0, saturation: 0, luminance: 0 },
  highlights: { hue: 0, saturation: 0, luminance: 0 },
  blending: 50,
  balance: 0,
};

const identityCurve = (): CurvePoint[] => [
  { x: 0, y: 0 },
  { x: 255, y: 255 },
];

export const DEFAULT_CURVES: CurveData = {
  rgb: identityCurve(),
  red: identityCurve(),
  green: identityCurve(),
  blue: identityCurve(),
};

export const DEFAULT_FINISHING: import('./types').FinishingEffects = {
  vignetteAmount: 0,
  vignetteRoundness: 0.5,
  grainAmount: 0,
  fadeAmount: 0,
};

export const DEFAULT_SPLIT_TONE: import('./types').SplitTone = {
  shadowHue: 220,
  shadowSaturation: 0,
  highlightHue: 40,
  highlightSaturation: 0,
  balance: 0,
};

export const DEFAULT_TILT_SHIFT: import('./types').TiltShift = {
  enabled: false,
  centerY: 0.5,
  bandSize: 0.25,
  blurAmount: 0.5,
  angle: 0,
};

export const DEFAULT_PERSPECTIVE: import('./types').PerspectiveCorrection = {
  horizontal: 0,
  vertical: 0,
  rotation: 0,
};
