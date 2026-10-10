import * as pdfjsLib from 'pdfjs-dist';
// Use Vite's worker URL resolution
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export interface RenderedPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
}

/**
 * Loads a PDF document from an ArrayBuffer or Uint8Array using pdf.js
 */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders a single PDF page to an offscreen canvas and returns a high-resolution data URL
 */
export async function renderPageToDataUrl(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  targetWidth = 300,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  
  // Calculate scale based on desired target width
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale: Math.max(scale, 0.5) });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // White background for transparent areas in PDF
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render to canvas
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;

  const dataUrl = canvas.toDataURL(format, quality);
  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Renders all pages of a PDF to image Blobs (for PDF to JPG/PNG conversion)
 */
export async function renderPdfToImages(
  pdfData: ArrayBuffer | Uint8Array,
  baseFilename: string,
  options: {
    format?: 'jpeg' | 'png';
    quality?: number; // 0.1 to 1.0
    dpiScale?: number; // 1 = ~72-96 dpi, 2 = ~150-200 dpi, 3 = ~300 dpi
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<RenderedPageImage[]> {
  const {
    format = 'jpeg',
    quality = 0.9,
    dpiScale = 2,
    onProgress
  } = options;

  const pdfDoc = await loadPdfDocument(pdfData);
  const totalPages = pdfDoc.numPages;
  const results: RenderedPageImage[] = [];

  const cleanBaseName = baseFilename.replace(/\.[^/.]+$/, '');
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: dpiScale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: format === 'png' });
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    // Convert canvas to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${pageNum} to image blob`));
        },
        mimeType,
        quality
      );
    });

    results.push({
      pageNumber: pageNum,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      filename: `${cleanBaseName}_page_${String(pageNum).padStart(3, '0')}.${ext}`,
    });

    if (onProgress) {
      onProgress(pageNum, totalPages);
    }
  }

  return results;
}
