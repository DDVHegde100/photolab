import type { ImageRecipe, ExportOptions } from '../core/types';
import { getDisplayUri } from '../core/types';

/** Web fallback — returns source URI without Skia baking. */
export async function bakeRecipeToImage(
  recipe: ImageRecipe,
  _options: ExportOptions
): Promise<string> {
  return getDisplayUri(recipe);
}
