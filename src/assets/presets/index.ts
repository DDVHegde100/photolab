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
  {
    id: 'film-70s',
    name: '70s Film',
    category: 'Film',
    adjustments: {
      contrast: -0.1,
      saturation: -0.15,
      temperature: 18,
      tint: 8,
      blacks: 0.12,
      highlights: -0.08,
    },
  },
  {
    id: 'film-kodak',
    name: 'Kodak Gold',
    category: 'Film',
    adjustments: {
      exposure: 0.06,
      temperature: 22,
      saturation: 0.08,
      contrast: 0.08,
      shadows: 0.08,
    },
  },
  {
    id: 'film-fuji',
    name: 'Fuji Pro',
    category: 'Film',
    adjustments: {
      temperature: -8,
      tint: -4,
      saturation: 0.12,
      contrast: 0.05,
      vibrance: 0.1,
    },
  },
  {
    id: 'vintage-fade',
    name: 'Vintage Fade',
    category: 'Vintage',
    adjustments: {
      contrast: -0.2,
      saturation: -0.3,
      blacks: 0.25,
      temperature: 12,
      exposure: 0.05,
    },
  },
  {
    id: 'vintage-sepia',
    name: 'Warm Sepia',
    category: 'Vintage',
    adjustments: {
      saturation: -0.4,
      temperature: 35,
      contrast: 0.1,
      exposure: 0.04,
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    category: 'Neon',
    adjustments: {
      contrast: 0.3,
      saturation: 0.35,
      vibrance: 0.4,
      temperature: -15,
      tint: 12,
      clarity: 0.2,
    },
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    category: 'Neon',
    adjustments: {
      contrast: 0.25,
      saturation: 0.3,
      tint: 18,
      temperature: 10,
      vibrance: 0.35,
    },
  },
  {
    id: 'neon-blue',
    name: 'Electric Blue',
    category: 'Neon',
    adjustments: {
      contrast: 0.28,
      temperature: -25,
      saturation: 0.25,
      clarity: 0.15,
      shadows: 0.1,
    },
  },
  {
    id: 'portrait-glow',
    name: 'Soft Glow',
    category: 'Portrait',
    adjustments: {
      exposure: 0.12,
      highlights: -0.15,
      shadows: 0.2,
      clarity: -0.15,
      vibrance: 0.08,
      temperature: 6,
    },
  },
  {
    id: 'portrait-matte',
    name: 'Matte Portrait',
    category: 'Portrait',
    adjustments: {
      contrast: -0.08,
      blacks: 0.15,
      saturation: -0.08,
      exposure: 0.05,
      clarity: -0.05,
    },
  },
  {
    id: 'hdr-natural',
    name: 'Natural HDR',
    category: 'HDR',
    adjustments: {
      exposure: 0.05,
      highlights: -0.25,
      shadows: 0.3,
      clarity: 0.15,
      vibrance: 0.1,
    },
  },
  {
    id: 'mono-high',
    name: 'High Contrast B&W',
    category: 'Monochrome',
    adjustments: {
      saturation: -1,
      contrast: 0.35,
      clarity: 0.25,
      blacks: -0.1,
    },
  },
  {
    id: 'mono-soft',
    name: 'Soft B&W',
    category: 'Monochrome',
    adjustments: {
      saturation: -1,
      contrast: -0.1,
      clarity: -0.05,
      exposure: 0.05,
    },
  },
  {
    id: 'moody-blue',
    name: 'Blue Hour',
    category: 'Moody',
    adjustments: {
      exposure: -0.1,
      temperature: -22,
      tint: -6,
      contrast: 0.15,
      saturation: -0.1,
      shadows: -0.05,
    },
  },
  {
    id: 'vivid-sunset',
    name: 'Sunset Pop',
    category: 'Vivid',
    adjustments: {
      temperature: 28,
      vibrance: 0.4,
      saturation: 0.25,
      contrast: 0.1,
      exposure: 0.05,
    },
  },
];

export const PRESET_PACKS = [
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'film', name: 'Film', icon: '🎞' },
  { id: 'vintage', name: 'Vintage', icon: '📼' },
  { id: 'neon', name: 'Neon', icon: '💜' },
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
