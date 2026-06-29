import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { GalleryImage, ImageRecipe } from '../core/types';
import { createRecipe, serializeRecipe, deserializeRecipe } from '../core/editEngine';

const GALLERY_KEY = '@photolab/gallery';
const RECIPES_KEY = '@photolab/recipes';

export async function importImage(sourceUri: string): Promise<GalleryImage> {
  const id = uuidv4();

  const image: GalleryImage = {
    id,
    uri: sourceUri,
    thumbnailUri: sourceUri,
    width: 0,
    height: 0,
    createdAt: Date.now(),
  };

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
    return data ? (JSON.parse(data) as GalleryImage[]) : [];
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
    return cached ? deserializeRecipe(cached) : null;
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
