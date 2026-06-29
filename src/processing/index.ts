import type { ProcessedImage } from './types';
import type { UpscaleFactor } from './upscaler';
import { progressiveUpscale } from './upscaler';
import {
  applyDenoise,
  applyPortraitEnhance,
  applyLowLightRecovery,
  applyAutoColor,
} from './skiaFilters';

export type EnhancementType =
  | 'upscale'
  | 'denoise'
  | 'portrait'
  | 'lowlight'
  | 'autocolor';

export interface EnhancementInput {
  uri: string;
  width: number;
  height: number;
}

export interface EnhancementOptions {
  strength?: number;
  upscaleFactor?: UpscaleFactor;
  onProgress?: (step: number, total: number) => void;
}

export const imageProcessor = {
  async upscale(
    input: EnhancementInput,
    options: EnhancementOptions = {}
  ): Promise<ProcessedImage> {
    const factor = options.upscaleFactor ?? 2;
    return progressiveUpscale(input.uri, input.width, input.height, {
      factor,
      sharpening: 0.4 + (options.strength ?? 0.7) * 0.35,
      onProgress: options.onProgress,
    });
  },

  async denoise(input: EnhancementInput, strength = 0.6): Promise<ProcessedImage> {
    return applyDenoise(input.uri, strength);
  },

  async portraitEnhance(input: EnhancementInput, strength = 0.65): Promise<ProcessedImage> {
    return applyPortraitEnhance(input.uri, strength);
  },

  async lowLightRecovery(input: EnhancementInput, strength = 0.7): Promise<ProcessedImage> {
    return applyLowLightRecovery(input.uri, strength);
  },

  async autoColor(input: EnhancementInput): Promise<ProcessedImage> {
    return applyAutoColor(input.uri);
  },
};

export type { ProcessedImage } from './types';
