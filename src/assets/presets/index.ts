import type { FilterPreset, AdjustmentValues } from '../../core/types';

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'cinematic-warm',
    name: 'Cinematic Warm',
    category: 'Cinematic',
    adjustments: {
      exposure: 0.05,
      contrast: 0.15,
      shadows: 0.1,
      temperature: 15,
      saturation: -0.1,
      clarity: 0.1,
    },
  },
  {
    id: 'cinematic-cool',
    name: 'Cinematic Cool',
    category: 'Cinematic',
    adjustments: {
      exposure: -0.05,
      contrast: 0.2,
      highlights: -0.15,
      temperature: -20,
      tint: 5,
      saturation: -0.05,
    },
  },
  {
    id: 'hdr-punch',
    name: 'HDR Punch',
    category: 'HDR',
    adjustments: {
      exposure: 0.1,
      contrast: 0.25,
      highlights: -0.2,
      shadows: 0.25,
      clarity: 0.3,
      vibrance: 0.2,
    },
  },
  {
    id: 'moody-dark',
    name: 'Moody Dark',
    category: 'Moody',
    adjustments: {
      exposure: -0.15,
      contrast: 0.2,
      shadows: -0.1,
      blacks: -0.15,
      saturation: -0.2,
      temperature: -10,
    },
  },
  {
    id: 'moody-fade',
    name: 'Faded Film',
    category: 'Moody',
    adjustments: {
      contrast: -0.15,
      highlights: -0.1,
      blacks: 0.2,
      saturation: -0.25,
      temperature: 10,
    },
  },
  {
    id: 'portrait-soft',
    name: 'Soft Portrait',
    category: 'Portrait',
    adjustments: {
      exposure: 0.08,
      highlights: -0.1,
      shadows: 0.15,
      clarity: -0.1,
      vibrance: 0.1,
      temperature: 8,
    },
  },
  {
    id: 'vivid-pop',
    name: 'Vivid Pop',
    category: 'Vivid',
    adjustments: {
      contrast: 0.15,
      vibrance: 0.35,
      saturation: 0.2,
      clarity: 0.15,
      sharpness: 0.1,
    },
  },
  {
    id: 'mono-classic',
    name: 'Classic B&W',
    category: 'Monochrome',
    adjustments: {
      saturation: -1,
      contrast: 0.2,
      clarity: 0.15,
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'Cinematic',
    adjustments: {
      exposure: 0.1,
      temperature: 35,
      tint: 5,
      highlights: -0.1,
      vibrance: 0.15,
      shadows: 0.1,
    },
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    category: 'Cinematic',
    adjustments: {
      contrast: 0.2,
      temperature: 15,
      tint: -5,
      saturation: 0.1,
      clarity: 0.1,
    },
  },
];

export const PRESET_PACKS = [
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'hdr', name: 'HDR', icon: '✨' },
  { id: 'moody', name: 'Moody', icon: '🌙' },
  { id: 'portrait', name: 'Portrait', icon: '👤' },
  { id: 'vivid', name: 'Vivid', icon: '🌈' },
  { id: 'monochrome', name: 'Monochrome', icon: '⬛' },
];

export function getPresetAdjustments(id: string): Partial<AdjustmentValues> | null {
  const preset = FILTER_PRESETS.find((p) => p.id === id);
  return preset?.adjustments ?? null;
}

export function getPresetsByCategory(category: string): FilterPreset[] {
  return FILTER_PRESETS.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}
