import { v4 as uuidv4 } from 'uuid';
import type { ImageRecipe, EditOperation, AdjustmentValues } from './types';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_HSL,
  DEFAULT_COLOR_GRADE,
  DEFAULT_CURVES,
} from './defaults';

export function createRecipe(imageId: string, originalUri: string): ImageRecipe {
  const now = Date.now();
  return {
    imageId,
    originalUri,
    edits: [],
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    hsl: structuredClone(DEFAULT_HSL),
    colorGrade: structuredClone(DEFAULT_COLOR_GRADE),
    curves: structuredClone(DEFAULT_CURVES),
    crop: null,
    masks: [],
    drawingLayers: [],
    enhancements: [],
    activeFilter: null,
    filterIntensity: 1,
    background: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function addEdit(
  recipe: ImageRecipe,
  type: EditOperation['type'],
  value: EditOperation['value']
): ImageRecipe {
  const edit: EditOperation = {
    id: uuidv4(),
    type,
    value,
    timestamp: Date.now(),
    enabled: true,
  };

  return {
    ...recipe,
    edits: [...recipe.edits, edit],
    updatedAt: Date.now(),
  };
}

export function updateAdjustments(
  recipe: ImageRecipe,
  adjustments: Partial<AdjustmentValues>
): ImageRecipe {
  return {
    ...recipe,
    adjustments: { ...recipe.adjustments, ...adjustments },
    updatedAt: Date.now(),
  };
}

export function applyEditStack(recipe: ImageRecipe): AdjustmentValues {
  let result = { ...DEFAULT_ADJUSTMENTS };

  for (const edit of recipe.edits) {
    if (!edit.enabled) continue;

    if (typeof edit.value === 'number') {
      const key = edit.type as keyof AdjustmentValues;
      if (key in result) {
        result[key] = edit.value;
      }
    }
  }

  result = { ...result, ...recipe.adjustments };
  return result;
}

export function resetAdjustments(recipe: ImageRecipe): ImageRecipe {
  return {
    ...recipe,
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    hsl: structuredClone(DEFAULT_HSL),
    colorGrade: structuredClone(DEFAULT_COLOR_GRADE),
    curves: structuredClone(DEFAULT_CURVES),
    activeFilter: null,
    filterIntensity: 1,
    updatedAt: Date.now(),
  };
}

export function serializeRecipe(recipe: ImageRecipe): string {
  return JSON.stringify(recipe, null, 2);
}

export function deserializeRecipe(json: string): ImageRecipe {
  const recipe = JSON.parse(json) as ImageRecipe;
  // Migrate legacy AI enhancement field
  if (!recipe.enhancements && recipe.aiEnhancements) {
    recipe.enhancements = recipe.aiEnhancements.map((e) => ({
      ...e,
      type: (e as { type: string }).type === 'face' ? 'portrait' as const : e.type,
    }));
  }
  if (!recipe.enhancements) recipe.enhancements = [];
  if (recipe.filterIntensity === undefined) recipe.filterIntensity = 1;
  if (recipe.background === undefined) recipe.background = null;
  return recipe;
}
