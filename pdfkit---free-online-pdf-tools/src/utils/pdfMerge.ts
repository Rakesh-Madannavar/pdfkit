import { PDFDocument } from 'pdf-lib';

export interface MergeOptions {
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Merges multiple PDF files into a single PDF document in the specified order
 */
export async function mergePdfFiles(
  pdfBuffers: Array<{ name: string; buffer: ArrayBuffer }>,
  options: MergeOptions = {}
): Promise<{ blob: Blob; pageCount: number }> {
  if (pdfBuffers.length === 0) {
    throw new Error('At least one PDF file is required to merge.');
  }

  const { onProgress } = options;
  const mergedPdf = await PDFDocument.create();
  let totalPagesCount = 0;

  for (let i = 0; i < pdfBuffers.length; i++) {
    const item = pdfBuffers[i];
    if (onProgress) {
      onProgress(i + 1, pdfBuffers.length, `Processing ${item.name} (${i + 1}/${pdfBuffers.length})...`);
    }

    try {
      const srcDoc = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      totalPagesCount += copiedPages.length;
    } catch (err: any) {
      console.error(`Error reading ${item.name}:`, err);
      if (err.message && err.message.toLowerCase().includes('password')) {
        throw new Error(`"${item.name}" is password-protected. Please remove the password before merging.`);
      }
      throw new Error(`Could not read "${item.name}". The file may be corrupted.`);
    }
  }

  if (onProgress) {
    onProgress(pdfBuffers.length, pdfBuffers.length, 'Finalizing merged document...');
  }

  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPagesCount,
  };
}
