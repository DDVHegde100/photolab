import type { MaskRegion } from '../core/types';

/** Procedural mask presets — refined with brush tool after creation */
export const MASK_PRESETS: Record<
  string,
  { label: string; icon: string; region: MaskRegion; type: MaskRegion['targetType'] }
> = {
  sky: {
    label: 'Sky Region',
    icon: '☁️',
    type: 'sky',
    region: {
      kind: 'gradient-linear',
      x: 0,
      y: 0,
      width: 1,
      height: 0.42,
      feather: 0.18,
      invert: false,
      targetType: 'sky',
    },
  },
  subject: {
    label: 'Center Subject',
    icon: '👤',
    type: 'subject',
    region: {
      kind: 'ellipse',
      x: 0.12,
      y: 0.08,
      width: 0.76,
      height: 0.84,
      feather: 0.22,
      invert: false,
      targetType: 'subject',
    },
  },
  foreground: {
    label: 'Foreground',
    icon: '🎯',
    type: 'foreground',
    region: {
      kind: 'gradient-radial',
      x: 0.5,
      y: 0.55,
      width: 0.85,
      height: 0.85,
      feather: 0.25,
      invert: false,
      targetType: 'foreground',
    },
  },
  background: {
    label: 'Background',
    icon: '🖼️',
    type: 'background',
    region: {
      kind: 'gradient-radial',
      x: 0.5,
      y: 0.55,
      width: 0.85,
      height: 0.85,
      feather: 0.25,
      invert: true,
      targetType: 'background',
    },
  },
  luminance: {
    label: 'Highlights',
    icon: '◐',
    type: 'luminance',
    region: {
      kind: 'luminance',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      feather: 0.15,
      invert: false,
      targetType: 'luminance',
      threshold: 0.62,
    },
  },
  shadows: {
    label: 'Shadows',
    icon: '◑',
    type: 'luminance',
    region: {
      kind: 'luminance',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      feather: 0.15,
      invert: true,
      targetType: 'luminance',
      threshold: 0.38,
    },
  },
};

export function getMaskPreset(id: string) {
  return MASK_PRESETS[id] ?? null;
}

export function listMaskPresets() {
  return Object.entries(MASK_PRESETS).map(([id, preset]) => ({ id, ...preset }));
}
