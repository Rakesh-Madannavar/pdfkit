import { PDFDocument } from 'pdf-lib';

export interface SignaturePlacement {
  pageNumber: number; // 1-based
  xPercent: number;   // 0 to 100 percentage from left
  yPercent: number;   // 0 to 100 percentage from top
  widthPercent: number; // e.g. 25% of page width
  signatureDataUrl: string; // base64 PNG
}

/**
 * Embeds a digital signature image at precise coordinates on a PDF page
 */
export async function signPdf(
  buffer: ArrayBuffer,
  placements: SignaturePlacement[],
  onProgress?: (percent: number, message: string) => void
): Promise<{ blob: Blob; pageCount: number }> {
  if (onProgress) onProgress(20, 'Loading PDF document...');
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = pdfDoc.getPageCount();

  for (let i = 0; i < placements.length; i++) {
    const item = placements[i];
    if (onProgress) {
      onProgress(30 + Math.round(((i + 1) / placements.length) * 60), `Stamping signature ${i + 1}...`);
    }

    const pageIdx = Math.max(0, Math.min(total - 1, item.pageNumber - 1));
    const page = pdfDoc.getPage(pageIdx);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Fetch and embed the signature PNG
    const pngBytes = await fetch(item.signatureDataUrl).then((r) => r.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(pngBytes);

    const sigWidth = (item.widthPercent / 100) * pageWidth;
    const aspectRatio = signatureImage.height / signatureImage.width;
    const sigHeight = sigWidth * aspectRatio;

    // Convert percentage top-left to PDF coordinate bottom-left
    const x = (item.xPercent / 100) * pageWidth;
    const yFromTop = (item.yPercent / 100) * pageHeight;
    const y = pageHeight - yFromTop - sigHeight;

    page.drawImage(signatureImage, {
      x: Math.max(0, Math.min(pageWidth - sigWidth, x)),
      y: Math.max(0, Math.min(pageHeight - sigHeight, y)),
      width: sigWidth,
      height: sigHeight,
    });
  }

  if (onProgress) onProgress(95, 'Finalizing signed document...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  if (onProgress) onProgress(100, 'Done!');
  return {
    blob,
    pageCount: total,
  };
}
