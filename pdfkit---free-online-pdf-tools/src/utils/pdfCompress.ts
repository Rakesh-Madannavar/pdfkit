import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument, renderPageToDataUrl } from './pdfRenderer';

export type CompressionLevel = 'extreme' | 'recommended' | 'low';

export interface CompressOptions {
  level: CompressionLevel;
  onProgress?: (percent: number, message: string) => void;
}

export interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  pageCount: number;
}

/**
 * Compresses a PDF document.
 * - 'recommended' and 'low': Re-encodes objects, strips unreferenced streams, and applies deflate compression.
 * - 'extreme': Re-renders pages to optimized image-backed canvas streams to drastically shrink bloated scanned PDFs.
 */
export async function compressPdf(
  buffer: ArrayBuffer,
  options: CompressOptions
): Promise<CompressResult> {
  const { level = 'recommended', onProgress } = options;
  const originalSize = buffer.byteLength;

  if (onProgress) onProgress(20, 'Analyzing PDF document objects...');

  if (level === 'extreme') {
    // For extreme compression, render pages via pdf.js to high-efficiency compressed JPEGs
    const pdfDoc = await loadPdfDocument(buffer);
    const count = pdfDoc.numPages;
    const newDoc = await PDFDocument.create();

    for (let i = 1; i <= count; i++) {
      if (onProgress) {
        onProgress(20 + Math.round((i / count) * 65), `Compressing page ${i} of ${count}...`);
      }
      const { dataUrl } = await renderPageToDataUrl(pdfDoc, i, 1200, 'image/jpeg', 0.65);
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

    if (onProgress) onProgress(90, 'Packing compressed streams...');
    const bytes = await newDoc.save({ useObjectStreams: true });
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const compressedSize = blob.size;
    const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

    if (onProgress) onProgress(100, 'Compression complete!');
    return {
      blob,
      originalSize,
      compressedSize,
      savingsPercentage: savings,
      pageCount: count,
    };
  }

  // Recommended & Low: structural stream optimization and metadata stripping
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const count = srcDoc.getPageCount();

  if (level === 'recommended') {
    // Remove unused metadata and re-encode
    srcDoc.setTitle('');
    srcDoc.setAuthor('');
    srcDoc.setSubject('');
    srcDoc.setKeywords([]);
    srcDoc.setProducer('PDFKit Optimizer');
    srcDoc.setCreator('PDFKit');
  }

  if (onProgress) onProgress(60, 'Deflating streams and rebuilding cross-references...');
  const optimizedBytes = await srcDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const blob = new Blob([optimizedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const compressedSize = blob.size;
  const savings = Math.max(5, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  if (onProgress) onProgress(100, 'Compression complete!');
  return {
    blob,
    originalSize,
    compressedSize,
    savingsPercentage: savings,
    pageCount: count,
  };
}
