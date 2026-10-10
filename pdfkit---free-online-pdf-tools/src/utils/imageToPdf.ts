import { PDFDocument, PageSizes } from 'pdf-lib';

export type PageSizeOption = 'fit' | 'a4' | 'letter';
export type MarginOption = 'none' | 'small' | 'large';
export type OrientationOption = 'portrait' | 'landscape' | 'auto';

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  margin: MarginOption;
  orientation: OrientationOption;
  onProgress?: (percent: number, message: string) => void;
}

export interface ImageInputItem {
  name: string;
  buffer: ArrayBuffer;
  type: string; // 'image/jpeg' | 'image/png' etc.
}

const MARGIN_VALUES: Record<MarginOption, number> = {
  none: 0,
  small: 20,
  large: 45,
};

/**
 * Combines multiple JPG or PNG images into a PDF with page size and margin configurations
 */
export async function convertImagesToPdf(
  images: ImageInputItem[],
  options: ImageToPdfOptions
): Promise<{ blob: Blob; pageCount: number }> {
  if (images.length === 0) {
    throw new Error('At least one image is required.');
  }

  const { pageSize, margin, orientation, onProgress } = options;
  const pdfDoc = await PDFDocument.create();
  const marginPx = MARGIN_VALUES[margin];

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / images.length) * 85),
        `Embedding image ${i + 1} of ${images.length}...`
      );
    }

    // Embed image depending on type
    let embeddedImage;
    const isPng = item.type.includes('png') || item.name.toLowerCase().endsWith('.png');

    try {
      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(item.buffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(item.buffer);
      }
    } catch {
      // Fallback: try the other format in case mimetype is mismatched
      try {
        if (isPng) {
          embeddedImage = await pdfDoc.embedJpg(item.buffer);
        } else {
          embeddedImage = await pdfDoc.embedPng(item.buffer);
        }
      } catch (fallbackErr) {
        throw new Error(`Failed to parse image "${item.name}". Ensure it is a valid JPG or PNG file.`);
      }
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;
    const isImageLandscape = imgWidth > imgHeight;

    let targetPageWidth: number;
    let targetPageHeight: number;

    if (pageSize === 'fit') {
      targetPageWidth = imgWidth + marginPx * 2;
      targetPageHeight = imgHeight + marginPx * 2;
    } else {
      let baseSize = pageSize === 'a4' ? PageSizes.A4 : PageSizes.Letter;
      let isTargetLandscape = false;

      if (orientation === 'auto') {
        isTargetLandscape = isImageLandscape;
      } else if (orientation === 'landscape') {
        isTargetLandscape = true;
      } else {
        isTargetLandscape = false;
      }

      if (isTargetLandscape) {
        targetPageWidth = Math.max(baseSize[0], baseSize[1]);
        targetPageHeight = Math.min(baseSize[0], baseSize[1]);
      } else {
        targetPageWidth = Math.min(baseSize[0], baseSize[1]);
        targetPageHeight = Math.max(baseSize[0], baseSize[1]);
      }
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Calculate dimensions to fit inside printable area with margin
    const availWidth = targetPageWidth - marginPx * 2;
    const availHeight = targetPageHeight - marginPx * 2;

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Center image on the page
    const drawX = marginPx + (availWidth - drawWidth) / 2;
    const drawY = marginPx + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  if (onProgress) onProgress(90, 'Generating final PDF document...');
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'Done!');

  return {
    blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: images.length,
  };
}
