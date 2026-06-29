import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import type { ImageRecipe, ExportOptions } from '../../core/types';
import { getDisplayUri } from '../../core/types';

export async function requestPermissions(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

export async function exportImage(
  recipe: ImageRecipe,
  options: ExportOptions
): Promise<string> {
  const sourceUri = getDisplayUri(recipe);

  const actions: ImageManipulator.Action[] = [];

  if (recipe.crop) {
    actions.push({
      crop: {
        originX: recipe.crop.x * 1000,
        originY: recipe.crop.y * 1000,
        width: recipe.crop.width * 1000,
        height: recipe.crop.height * 1000,
      },
    });
  }

  if (options.scale > 1) {
    actions.push({ resize: { width: 1000 * options.scale } });
  }

  if (recipe.crop?.rotation) {
    actions.push({ rotate: recipe.crop.rotation });
  }

  const format =
    options.format === 'png'
      ? ImageManipulator.SaveFormat.PNG
      : ImageManipulator.SaveFormat.JPEG;

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    actions.length > 0 ? actions : [{ resize: { width: 1000 * options.scale } }],
    {
      compress: options.format === 'jpeg' ? options.quality : 1,
      format,
    }
  );

  return result.uri;
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
