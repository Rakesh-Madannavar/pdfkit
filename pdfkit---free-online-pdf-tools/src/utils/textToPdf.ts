import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export interface TextToPdfOptions {
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
  title?: string;
  onProgress?: (percent: number, message: string) => void;
}

/**
 * Converts raw text into a paginated PDF document with header & footer
 */
export async function convertTextToPdf(
  rawText: string,
  options: TextToPdfOptions = {}
): Promise<{ blob: Blob; pageCount: number }> {
  const {
    fontSize = 11,
    lineHeight = 16,
    margin = 50,
    title = 'Document',
    onProgress,
  } = options;

  if (onProgress) onProgress(15, 'Preparing text layout...');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [pageWidth, pageHeight] = PageSizes.A4;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2 - 40; // reserve space for header/footer

  // Break text into lines fitting printableWidth
  const rawParagraphs = rawText.split('\n');
  const wrappedLines: string[] = [];

  for (const para of rawParagraphs) {
    if (!para.trim()) {
      wrappedLines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= printableWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
  }

  const linesPerPage = Math.floor(printableHeight / lineHeight);
  const totalPages = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage));

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(15 + Math.round((pageNum / totalPages) * 75), `Rendering page ${pageNum} of ${totalPages}...`);
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Header title
    page.drawText(title, {
      x: margin,
      y: pageHeight - margin + 15,
      size: 9,
      font: boldFont,
      color: rgb(0.4, 0.45, 0.5),
    });

    // Hairline header divider
    page.drawLine({
      start: { x: margin, y: pageHeight - margin + 8 },
      end: { x: pageWidth - margin, y: pageHeight - margin + 8 },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.9),
    });

    // Content lines
    const startLine = (pageNum - 1) * linesPerPage;
    const endLine = Math.min(wrappedLines.length, startLine + linesPerPage);
    let yPos = pageHeight - margin - 15;

    for (let i = startLine; i < endLine; i++) {
      const line = wrappedLines[i];
      if (line) {
        page.drawText(line, {
          x: margin,
          y: yPos,
          size: fontSize,
          font,
          color: rgb(0.15, 0.2, 0.25),
        });
      }
      yPos -= lineHeight;
    }

    // Footer page number
    const footerText = `Page ${pageNum} of ${totalPages}`;
    const footerWidth = font.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: pageWidth - margin - footerWidth,
      y: margin - 20,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.6),
    });
  }

  if (onProgress) onProgress(95, 'Finalizing document...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  if (onProgress) onProgress(100, 'Done!');
  return {
    blob,
    pageCount: totalPages,
  };
}
