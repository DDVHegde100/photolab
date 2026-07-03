export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

const MAX_IMPORT_BYTES = 30 * 1024 * 1024;
const MAX_CANVAS_PIXELS = 80_000_000;

export function pickImageFromLibrary(): Promise<PickedImage | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }
      if (file.size > MAX_IMPORT_BYTES) {
        reject(new Error('Image is larger than 30MB. Try a smaller source image.'));
        return;
      }

      const uri = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        if (img.naturalWidth * img.naturalHeight > MAX_CANVAS_PIXELS) {
          URL.revokeObjectURL(uri);
          reject(new Error('Image is too large for browser canvas processing.'));
          return;
        }
        resolve({ uri, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = uri;
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };

    input.click();
  });
}
