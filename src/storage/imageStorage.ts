import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { GalleryImage, ImageRecipe } from '../core/types';
import { createRecipe, serializeRecipe, deserializeRecipe } from '../core/editEngine';
import { probeImageDimensions } from '../processing/skiaResize';

const GALLERY_KEY = '@photolab/gallery';
const RECIPES_KEY = '@photolab/recipes';

function getImagesDir(): Directory {
  return new Directory(Paths.document, 'images');
}

function getRecipesDir(): Directory {
  return new Directory(Paths.document, 'recipes');
}

function ensureDirs(): void {
  const imagesDir = getImagesDir();
  const recipesDir = getRecipesDir();
  if (!imagesDir.exists) imagesDir.create();
  if (!recipesDir.exists) recipesDir.create();
}

export async function importImage(
  sourceUri: string,
  dimensions?: { width: number; height: number }
): Promise<GalleryImage> {
  ensureDirs();
  const id = uuidv4();
  const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const destFile = new File(getImagesDir(), `${id}.${ext}`);

  const sourceFile = new File(sourceUri);
  await sourceFile.copy(destFile);

  let width = dimensions?.width ?? 0;
  let height = dimensions?.height ?? 0;
  if (width <= 0 || height <= 0) {
    try {
      const probed = await probeImageDimensions(destFile.uri);
      width = probed.width;
      height = probed.height;
    } catch {
      /* picker dimensions or probe unavailable */
    }
  }

  const image: GalleryImage = {
    id,
    uri: destFile.uri,
    thumbnailUri: destFile.uri,
    width,
    height,
    createdAt: Date.now(),
  };

  const recipe = createRecipe(id, destFile.uri);
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
  ensureDirs();
  const file = new File(getRecipesDir(), `${recipe.imageId}.json`);
  if (!file.exists) file.create();
  file.write(serializeRecipe(recipe));
  await AsyncStorage.setItem(`${RECIPES_KEY}/${recipe.imageId}`, serializeRecipe(recipe));
}

export async function loadRecipe(imageId: string): Promise<ImageRecipe | null> {
  try {
    const cached = await AsyncStorage.getItem(`${RECIPES_KEY}/${imageId}`);
    if (cached) return deserializeRecipe(cached);

    const file = new File(getRecipesDir(), `${imageId}.json`);
    if (file.exists) {
      const content = await file.text();
      return deserializeRecipe(content);
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteImage(id: string): Promise<void> {
  const gallery = await loadGallery();
  const image = gallery.find((i) => i.id === id);
  const filtered = gallery.filter((i) => i.id !== id);
  await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(filtered));

  if (image) {
    const imageFile = new File(image.uri);
    if (imageFile.exists) imageFile.delete();
  }

  const recipeFile = new File(getRecipesDir(), `${id}.json`);
  if (recipeFile.exists) recipeFile.delete();
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
