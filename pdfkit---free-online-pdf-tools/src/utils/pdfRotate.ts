import { PDFDocument, degrees } from 'pdf-lib';

export interface PageRotationMap {
  [pageIndex: number]: number; // 0, 90, 180, 270 relative additional rotation
}

/**
 * Applies rotations to a PDF document and returns the rotated PDF Blob
 */
export async function rotatePdf(
  pdfBuffer: ArrayBuffer,
  pageRotations: PageRotationMap, // 0-based page index -> additional degrees (0, 90, 180, 270)
  globalRotation = 0, // optional uniform rotation applied to all pages
  onProgress?: (percent: number, message: string) => void
): Promise<{ blob: Blob; pageCount: number }> {
  if (onProgress) onProgress(20, 'Loading document...');
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const existingRotation = page.getRotation().angle;
    const additional = (pageRotations[i] || 0) + globalRotation;
    const newAngle = ((existingRotation + additional) % 360 + 360) % 360;

    page.setRotation(degrees(newAngle));

    if (onProgress && i % 5 === 0) {
      onProgress(20 + Math.round(((i + 1) / total) * 60), `Rotating page ${i + 1} of ${total}...`);
    }
  }

  if (onProgress) onProgress(90, 'Saving rotated document...');
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'Done!');

  return {
    blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: total,
  };
}
