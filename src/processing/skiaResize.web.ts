export async function probeImageDimensions(
  _uri: string
): Promise<{ width: number; height: number }> {
  return { width: 0, height: 0 };
}
