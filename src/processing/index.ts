import type { ProcessedImage } from './types';
import type { UpscaleFactor, UpscaleQuality } from './upscaler';
import { progressiveUpscale, probeImageDimensions } from './upscaler';
import {
  applyDenoise,
  applyPortraitEnhance,
  applyLowLightRecovery,
  applyAutoColor,
  applyAnimeCleanup,
  applyArtifactCleanup,
  applyLineArtCleanup,
} from './skiaFilters';
import { replaceBackground } from './compositor';
import type { BackgroundLayer } from '../core/types';

export type EnhancementType =
  | 'upscale'
  | 'denoise'
  | 'portrait'
  | 'lowlight'
  | 'autocolor'
  | 'anime-clean'
  | 'artifact-clean'
  | 'line-art'
  | 'background';

export interface EnhancementInput {
  uri: string;
  width: number;
  height: number;
}

export interface EnhancementOptions {
  strength?: number;
  upscaleFactor?: UpscaleFactor;
  upscaleQuality?: UpscaleQuality;
  background?: BackgroundLayer;
  onProgress?: (step: number, total: number, label?: string) => void;
}

export const imageProcessor = {
  async upscale(
    input: EnhancementInput,
    options: EnhancementOptions = {}
  ): Promise<ProcessedImage> {
    const factor = options.upscaleFactor ?? 2;
    let dims = input;
    if (input.width <= 0 || input.height <= 0) {
      dims = { ...input, ...(await probeImageDimensions(input.uri)) };
    }
    return progressiveUpscale(dims.uri, dims.width, dims.height, {
      factor,
      sharpening: options.strength ?? 0.75,
      quality: options.upscaleQuality ?? 'high',
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

  async animeCleanup(input: EnhancementInput, strength = 0.75): Promise<ProcessedImage> {
    return applyAnimeCleanup(input.uri, strength);
  },

  async artifactCleanup(input: EnhancementInput, strength = 0.65): Promise<ProcessedImage> {
    return applyArtifactCleanup(input.uri, strength);
  },

  async lineArtCleanup(input: EnhancementInput, strength = 0.75): Promise<ProcessedImage> {
    return applyLineArtCleanup(input.uri, strength);
  },

  async replaceBackground(
    input: EnhancementInput,
    background: BackgroundLayer,
    strength = 0.7
  ): Promise<ProcessedImage & { maskUri: string }> {
    return replaceBackground(input.uri, background, {
      threshold: 35 + (1 - strength) * 25,
      feather: 10 + strength * 8,
    });
  },

  probeDimensions: probeImageDimensions,
};

export type { ProcessedImage } from './types';
