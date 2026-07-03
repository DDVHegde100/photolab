import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { GalleryImage, ImageRecipe } from '../core/types';
import { createRecipe, serializeRecipe, deserializeRecipe } from '../core/editEngine';
import { probeImageDimensions } from '../processing/skiaResize';
import { persistImageBlob, restoreImageBlobUrl, deleteImageBlob } from './webBlobStore.web';

const GALLERY_KEY = '@photolab/gallery';
const RECIPES_KEY = '@photolab/recipes';

export async function importImage(
  sourceUri: string,
  dimensions?: { width: number; height: number }
): Promise<GalleryImage> {
  const id = uuidv4();

  let width = dimensions?.width ?? 0;
  let height = dimensions?.height ?? 0;
  if (width <= 0 || height <= 0) {
    try {
      const probed = await probeImageDimensions(sourceUri);
      width = probed.width;
      height = probed.height;
    } catch {
      /* dimensions unavailable */
    }
  }

  const image: GalleryImage = {
    id,
    uri: sourceUri,
    thumbnailUri: sourceUri,
    width,
    height,
    createdAt: Date.now(),
  };

  try {
    await persistImageBlob(id, sourceUri);
  } catch {
    /* IndexedDB may be unavailable in private browsing; blob URLs still work for the session. */
  }

  const recipe = createRecipe(id, sourceUri);
  await saveRecipe(recipe);

  const gallery = await loadGallery();
  gallery.unshift(image);
  await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));

  return image;
}

export async function loadGallery(): Promise<GalleryImage[]> {
  try {
    const data = await AsyncStorage.getItem(GALLERY_KEY);
    const gallery = data ? (JSON.parse(data) as GalleryImage[]) : [];
    const restored = await Promise.all(
      gallery.map(async (image) => {
        const restoredUri = await restoreImageBlobUrl(image.id);
        return restoredUri
          ? { ...image, uri: restoredUri, thumbnailUri: restoredUri }
          : image;
      })
    );
    return restored;
  } catch {
    return [];
  }
}

export async function saveRecipe(recipe: ImageRecipe): Promise<void> {
  await AsyncStorage.setItem(`${RECIPES_KEY}/${recipe.imageId}`, serializeRecipe(recipe));
}

export async function loadRecipe(imageId: string): Promise<ImageRecipe | null> {
  try {
    const cached = await AsyncStorage.getItem(`${RECIPES_KEY}/${imageId}`);
    if (!cached) return null;
    const recipe = deserializeRecipe(cached);
    const restoredUri = await restoreImageBlobUrl(imageId);
    return restoredUri ? { ...recipe, originalUri: restoredUri } : recipe;
  } catch {
    return null;
  }
}

export async function deleteImage(id: string): Promise<void> {
  const gallery = await loadGallery();
  const image = gallery.find((i) => i.id === id);
  const filtered = gallery.filter((i) => i.id !== id);
  await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(filtered));

  if (image?.uri.startsWith('blob:')) {
    URL.revokeObjectURL(image.uri);
  }

  await deleteImageBlob(id);
  await AsyncStorage.removeItem(`${RECIPES_KEY}/${id}`);
}

export async function updateGalleryImage(image: GalleryImage): Promise<void> {
  const gallery = await loadGallery();
  const index = gallery.findIndex((i) => i.id === image.id);
  if (index >= 0) {
    gallery[index] = image;
    await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  }
}
