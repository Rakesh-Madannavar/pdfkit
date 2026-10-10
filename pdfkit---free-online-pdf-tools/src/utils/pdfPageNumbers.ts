import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat =
  | 'page-n'        // Page 1
  | 'page-n-of-total' // Page 1 of 10
  | 'n'             // 1
  | 'n-slash-total' // 1 / 10
  | 'dash-n-dash';  // - 1 -

export interface AddPageNumbersOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  fontSize: number;
  colorHex?: string; // e.g. "#4b5563"
  margin?: number;
  onProgress?: (percent: number, message: string) => void;
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0.2 : r, isNaN(g) ? 0.2 : g, isNaN(b) ? 0.2 : b);
}

/**
 * Injects formatted page numbers onto each page of a PDF document
 */
export async function addPageNumbersToPdf(
  pdfBuffer: ArrayBuffer,
  options: AddPageNumbersOptions
): Promise<{ blob: Blob; pageCount: number }> {
  const {
    position = 'bottom-center',
    format = 'page-n-of-total',
    startNumber = 1,
    fontSize = 11,
    colorHex = '#374151',
    margin = 25,
    onProgress,
  } = options;

  if (onProgress) onProgress(15, 'Loading PDF document...');
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const textColor = hexToRgb(colorHex);

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = startNumber + i;

    // Generate formatted text
    let label = '';
    switch (format) {
      case 'page-n':
        label = `Page ${currentNum}`;
        break;
      case 'page-n-of-total':
        label = `Page ${currentNum} of ${totalPages + startNumber - 1}`;
        break;
      case 'n':
        label = `${currentNum}`;
        break;
      case 'n-slash-total':
        label = `${currentNum} / ${totalPages + startNumber - 1}`;
        break;
      case 'dash-n-dash':
        label = `- ${currentNum} -`;
        break;
      default:
        label = `${currentNum}`;
    }

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x = 0;
    let y = 0;

    // Horizontal placement
    if (position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (position.includes('left')) {
      x = margin;
    } else if (position.includes('right')) {
      x = width - margin - textWidth;
    }

    // Vertical placement
    if (position.startsWith('top')) {
      y = height - margin - textHeight;
    } else {
      y = margin;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: textColor,
    });

    if (onProgress && (i % 5 === 0 || i === totalPages - 1)) {
      onProgress(15 + Math.round(((i + 1) / totalPages) * 70), `Numbering page ${i + 1} of ${totalPages}...`);
    }
  }

  if (onProgress) onProgress(90, 'Saving numbered PDF...');
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'Done!');

  return {
    blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: totalPages,
  };
}
