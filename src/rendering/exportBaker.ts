import { Skia, TileMode, ImageFormat } from '@shopify/react-native-skia';
import { File, Directory, Paths } from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import type { ImageRecipe, ExportOptions } from '../core/types';
import { getDisplayUri } from '../core/types';
import { computeRenderParams } from '../rendering/filterPipeline';
import { loadSkiaImage } from '../processing/skiaFilters';

function getExportDir(): Directory {
  const dir = new Directory(Paths.document, 'exports');
  if (!dir.exists) dir.create();
  return dir;
}

/** Bake color matrix adjustments into pixels via Skia offscreen render. */
export async function bakeRecipeToImage(
  recipe: ImageRecipe,
  options: ExportOptions
): Promise<string> {
  const sourceUri = getDisplayUri(recipe);
  const image = await loadSkiaImage(sourceUri);
  let w = image.width();
  let h = image.height();

  if (options.scale > 1) {
    w = Math.round(w * options.scale);
    h = Math.round(h * options.scale);
  }

  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Failed to create export surface');

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));

  const { colorMatrix } = computeRenderParams(recipe);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  const colorFilter = Skia.ColorFilter.MakeMatrix(colorMatrix);
  paint.setColorFilter(colorFilter);

  if (recipe.background?.enabled && recipe.background.maskUri) {
    const mask = await loadSkiaImage(recipe.background.maskUri);

    if (recipe.background.type === 'color' && recipe.background.color) {
      canvas.clear(Skia.Color(recipe.background.color));
    } else if (recipe.background.type === 'blur') {
      const sigma = 2 + (recipe.background.blurAmount ?? 0.6) * 20;
      const blurPaint = Skia.Paint();
      blurPaint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null));
      canvas.drawImageRect(
        image,
        Skia.XYWHRect(0, 0, image.width(), image.height()),
        Skia.XYWHRect(0, 0, w, h),
        blurPaint
      );
    }

    canvas.saveLayer();
    canvas.drawImageRect(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, w, h),
      paint
    );
    const maskPaint = Skia.Paint();
    maskPaint.setBlendMode(5);
    canvas.drawImageRect(
      mask,
      Skia.XYWHRect(0, 0, mask.width(), mask.height()),
      Skia.XYWHRect(0, 0, w, h),
      maskPaint
    );
    canvas.restore();
  } else {
    canvas.drawImageRect(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, w, h),
      paint
    );
  }

  const snapshot = surface.makeImageSnapshot();
  const format = options.format === 'png' ? ImageFormat.PNG : ImageFormat.JPEG;
  const quality = options.format === 'jpeg' ? Math.round(options.quality * 100) : 100;
  const bytes = snapshot.encodeToBytes(format, quality);

  const ext = options.format === 'png' ? 'png' : 'jpg';
  const file = new File(getExportDir(), `${uuidv4()}_export.${ext}`);
  if (!file.exists) file.create();
  file.write(bytes);

  return file.uri;
}
