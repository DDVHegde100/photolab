import { loadHTMLImage } from '../rendering/webCanvas.web';

export async function probeImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  const img = await loadHTMLImage(uri);
  return { width: img.naturalWidth, height: img.naturalHeight };
}
