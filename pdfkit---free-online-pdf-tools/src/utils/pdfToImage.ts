import { renderPdfToImages, RenderedPageImage } from './pdfRenderer';
import { createZipFile } from './download';

export interface ConvertPdfToImageOptions {
  format: 'jpeg' | 'png';
  dpiScale: number; // 1, 2, or 3
  quality: number;  // 0.7 to 1.0
  onProgress?: (percent: number, message: string) => void;
}

export interface ConvertPdfToImageResult {
  images: RenderedPageImage[];
  zipBlob?: Blob;
  singleBlob?: Blob;
  singleFilename?: string;
  zipFilename?: string;
  isZip: boolean;
  pageCount: number;
}

/**
 * Converts all pages of a PDF to images and creates a ZIP archive if multiple pages
 */
export async function convertPdfToImages(
  pdfBuffer: ArrayBuffer,
  baseFilename: string,
  options: ConvertPdfToImageOptions
): Promise<ConvertPdfToImageResult> {
  const { format, dpiScale, quality, onProgress } = options;
  const cleanName = baseFilename.replace(/\.[^/.]+$/, '');

  const renderedImages = await renderPdfToImages(pdfBuffer, baseFilename, {
    format,
    quality,
    dpiScale,
    onProgress: (current, total) => {
      if (onProgress) {
        const percent = Math.round((current / total) * 80);
        onProgress(percent, `Rendering page ${current} of ${total} to high-res image...`);
      }
    },
  });

  if (renderedImages.length === 0) {
    throw new Error('No pages were found in the document.');
  }

  const ext = format === 'png' ? 'png' : 'jpg';

  // If single page, can be downloaded directly
  if (renderedImages.length === 1) {
    if (onProgress) onProgress(100, 'Image ready!');
    return {
      images: renderedImages,
      singleBlob: renderedImages[0].blob,
      singleFilename: `${cleanName}_page_001.${ext}`,
      isZip: false,
      pageCount: 1,
    };
  }

  // Multiple pages: package into ZIP
  if (onProgress) onProgress(85, 'Packaging images into ZIP archive...');
  const filesForZip = renderedImages.map((img) => ({
    name: img.filename,
    content: img.blob,
  }));

  const zipBlob = await createZipFile(filesForZip, (zipPercent) => {
    if (onProgress) {
      onProgress(85 + Math.round((zipPercent / 100) * 15), 'Compressing ZIP package...');
    }
  });

  if (onProgress) onProgress(100, 'Done!');

  return {
    images: renderedImages,
    zipBlob,
    zipFilename: `${cleanName}_images.zip`,
    isZip: true,
    pageCount: renderedImages.length,
  };
}
