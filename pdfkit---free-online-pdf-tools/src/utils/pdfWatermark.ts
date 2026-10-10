import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export interface WatermarkOptions {
  text: string;
  opacity: number;      // 0.05 to 1.0
  rotation: number;     // degrees: -90 to 90 (typically 45 or 0)
  fontSize: number;     // 18 to 96
  colorHex?: string;    // e.g. '#94a3b8' or '#dc2626'
  onProgress?: (percent: number, message: string) => void;
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0.5 : r, isNaN(g) ? 0.5 : g, isNaN(b) ? 0.5 : b);
}

/**
 * Applies a centered, rotated, semi-transparent text watermark to each page of a PDF
 */
export async function addWatermarkToPdf(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<{ blob: Blob; pageCount: number }> {
  const {
    text,
    opacity = 0.25,
    rotation = 45,
    fontSize = 48,
    colorHex = '#dc2626',
    onProgress,
  } = options;

  if (!text || text.trim() === '') {
    throw new Error('Watermark text cannot be empty.');
  }

  if (onProgress) onProgress(15, 'Loading PDF document...');
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const color = hexToRgb(colorHex);

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // Center point of page
    const centerX = width / 2;
    const centerY = height / 2;

    // To rotate around text center:
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Offset from origin to center of unrotated text
    const halfW = textWidth / 2;
    const halfH = textHeight / 2;

    // Draw position
    const drawX = centerX - (halfW * cos - halfH * sin);
    const drawY = centerY - (halfW * sin + halfH * cos);

    page.drawText(text, {
      x: drawX,
      y: drawY,
      size: fontSize,
      font,
      color,
      opacity: Math.max(0.05, Math.min(1.0, opacity)),
      rotate: degrees(rotation),
    });

    if (onProgress && (i % 5 === 0 || i === totalPages - 1)) {
      onProgress(15 + Math.round(((i + 1) / totalPages) * 70), `Watermarking page ${i + 1} of ${totalPages}...`);
    }
  }

  if (onProgress) onProgress(90, 'Finalizing watermarked PDF...');
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'Done!');

  return {
    blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: totalPages,
  };
}
