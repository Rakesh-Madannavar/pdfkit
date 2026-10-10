import { PDFDocument, degrees } from 'pdf-lib';

export interface OrganizePageItem {
  originalIndex: number; // 0-based index in the source PDF
  rotation?: number;      // degrees: 0, 90, 180, 270
}

/**
 * Reorders, duplicates, rotates, and deletes pages according to the specified page sequence
 */
export async function organizePdf(
  pdfBuffer: ArrayBuffer,
  pageSequence: OrganizePageItem[],
  onProgress?: (percent: number, message: string) => void
): Promise<{ blob: Blob; pageCount: number }> {
  if (pageSequence.length === 0) {
    throw new Error('At least one page must remain in the document.');
  }

  if (onProgress) onProgress(15, 'Loading source PDF...');
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  // Extract indices in the exact sequence requested (including duplicates)
  const total = pageSequence.length;
  for (let i = 0; i < total; i++) {
    const item = pageSequence[i];
    if (onProgress && (i % 3 === 0 || i === total - 1)) {
      onProgress(15 + Math.round(((i + 1) / total) * 70), `Arranging page ${i + 1} of ${total}...`);
    }

    const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);

    if (item.rotation) {
      const currentAngle = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees(((currentAngle + item.rotation) % 360 + 360) % 360));
    }

    newDoc.addPage(copiedPage);
  }

  if (onProgress) onProgress(90, 'Writing optimized PDF...');
  const pdfBytes = await newDoc.save();
  if (onProgress) onProgress(100, 'Done!');

  return {
    blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: total,
  };
}
