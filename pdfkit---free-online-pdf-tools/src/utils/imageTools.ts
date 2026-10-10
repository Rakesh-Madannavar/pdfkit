export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.1 to 1.0
}

export async function processImage(
  file: File,
  options: ProcessImageOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; originalSize: number; newSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const { maxWidth, maxHeight, format, quality } = options;

      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context could not be acquired.'));
        return;
      }

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL(format, quality);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image to blob.'));
            return;
          }
          resolve({
            blob,
            dataUrl,
            width,
            height,
            originalSize: file.size,
            newSize: blob.size,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image file.'));
    img.src = url;
  });
}
