/** Web stub — background segmentation requires native Skia readPixels. */
export async function segmentSubject(
  _uri: string,
  _options?: { threshold?: number; feather?: number; invert?: boolean }
): Promise<{ maskUri: string; width: number; height: number }> {
  throw new Error('Background replacement is available on iOS and Android only.');
}

export async function blurBackground(
  uri: string,
  _maskUri: string,
  _blurAmount: number
): Promise<{ uri: string; width: number; height: number }> {
  return { uri, width: 0, height: 0 };
}
