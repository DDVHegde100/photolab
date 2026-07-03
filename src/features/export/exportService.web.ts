import { bakeRecipeToImage } from '../../rendering/exportBaker';
import type { ImageRecipe, ExportOptions } from '../../core/types';

export async function requestPermissions(): Promise<boolean> {
  return true;
}

export async function exportImage(
  recipe: ImageRecipe,
  options: ExportOptions
): Promise<string> {
  return bakeRecipeToImage(recipe, options);
}

export async function saveToGallery(uri: string): Promise<boolean> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `photolab-export-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch {
    return false;
  }
}

export async function shareImage(uri: string): Promise<void> {
  if (navigator.share) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], 'photolab-export.png', { type: blob.type });
    await navigator.share({ files: [file], title: 'PhotoLab Export' });
  } else {
    await saveToGallery(uri);
  }
}
