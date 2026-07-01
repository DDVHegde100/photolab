import { bakeRecipeToImage } from '../../rendering/exportBaker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import type { ImageRecipe, ExportOptions } from '../../core/types';

export async function requestPermissions(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

export async function exportImage(
  recipe: ImageRecipe,
  options: ExportOptions
): Promise<string> {
  return bakeRecipeToImage(recipe, options);
}

export async function saveToGallery(uri: string): Promise<boolean> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return false;

  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}

export async function shareImage(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
