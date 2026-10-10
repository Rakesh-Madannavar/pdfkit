import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument, renderPageToDataUrl } from './pdfRenderer';

/**
 * Flattens all interactive form fields, annotations, and layers into permanent rasterized pages
 */
export async function flattenPdf(
  buffer: ArrayBuffer,
  onProgress?: (percent: number, message: string) => void
): Promise<{ blob: Blob; pageCount: number }> {
  if (onProgress) onProgress(15, 'Loading document elements...');
  const pdfDoc = await loadPdfDocument(buffer);
  const total = pdfDoc.numPages;
  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= total; i++) {
    if (onProgress) {
      onProgress(15 + Math.round((i / total) * 75), `Flattening page ${i} of ${total}...`);
    }
    const { dataUrl } = await renderPageToDataUrl(pdfDoc, i, 1400, 'image/jpeg', 0.92);
    const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
    const embedded = await newDoc.embedJpg(imgBytes);
    const page = newDoc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  if (onProgress) onProgress(95, 'Writing static PDF...');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  if (onProgress) onProgress(100, 'Done!');
  return {
    blob,
    pageCount: total,
  };
}
