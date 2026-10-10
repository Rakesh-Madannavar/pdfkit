import { PDFDocument } from 'pdf-lib';

export interface CropMargins {
  top: number;    // points to trim from top
  bottom: number; // points to trim from bottom
  left: number;   // points to trim from left
  right: number;  // points to trim from right
}

/**
 * Applies crop box trimming to all pages of a PDF document
 */
export async function cropPdf(
  buffer: ArrayBuffer,
  margins: CropMargins,
  onProgress?: (percent: number, message: string) => void
): Promise<{ blob: Blob; pageCount: number }> {
  if (onProgress) onProgress(20, 'Loading document for crop adjustment...');
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    const cropX = Math.max(0, margins.left);
    const cropY = Math.max(0, margins.bottom);
    const cropW = Math.max(50, width - margins.left - margins.right);
    const cropH = Math.max(50, height - margins.top - margins.bottom);

    page.setCropBox(cropX, cropY, cropW, cropH);

    if (onProgress && i % 4 === 0) {
      onProgress(20 + Math.round(((i + 1) / total) * 70), `Cropping page ${i + 1} of ${total}...`);
    }
  }

  if (onProgress) onProgress(95, 'Saving cropped PDF document...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  if (onProgress) onProgress(100, 'Done!');
  return {
    blob,
    pageCount: total,
  };
}
