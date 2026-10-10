import { loadPdfDocument } from './pdfRenderer';

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
}

export interface PdfTextExtractionResult {
  fullText: string;
  pages: ExtractedPageText[];
  totalWords: number;
  totalCharacters: number;
  pageCount: number;
  htmlContent: string;
}

/**
 * Extracts all readable text and structural lines from a PDF document
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer,
  onProgress?: (percent: number, message: string) => void
): Promise<PdfTextExtractionResult> {
  if (onProgress) onProgress(15, 'Loading PDF document text stream...');
  const pdfDoc = await loadPdfDocument(buffer);
  const total = pdfDoc.numPages;

  const pagesResult: ExtractedPageText[] = [];
  const fullTextParts: string[] = [];
  const htmlSections: string[] = [];

  for (let i = 1; i <= total; i++) {
    if (onProgress) {
      onProgress(15 + Math.round((i / total) * 75), `Extracting text from page ${i} of ${total}...`);
    }

    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str: string; hasEOL?: boolean }>;

    let pageText = '';
    let lastY: number | null = null;

    for (const item of items) {
      if ('str' in item) {
        pageText += item.str + (item.hasEOL ? '\n' : ' ');
      }
    }

    const cleanText = pageText.replace(/[ \t]+/g, ' ').trim();
    pagesResult.push({
      pageNumber: i,
      text: cleanText,
    });

    fullTextParts.push(`--- Page ${i} ---\n${cleanText}`);

    // Generate clean HTML section
    const paragraphs = cleanText
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
    htmlSections.push(`<section class="pdf-page" data-page="${i}">\n  <header><h3>Page ${i}</h3></header>\n  ${paragraphs}\n</section>`);
  }

  const combinedText = fullTextParts.join('\n\n');
  const words = combinedText.trim().split(/\s+/).filter(Boolean).length;
  const chars = combinedText.length;

  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Extracted PDF Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    .pdf-page { border-bottom: 2px dashed #cbd5e1; margin-bottom: 40px; padding-bottom: 30px; }
    header h3 { color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
    p { margin-bottom: 1em; }
  </style>
</head>
<body>
  ${htmlSections.join('\n')}
</body>
</html>`;

  if (onProgress) onProgress(100, 'Text extraction complete!');

  return {
    fullText: combinedText,
    pages: pagesResult,
    totalWords: words,
    totalCharacters: chars,
    pageCount: total,
    htmlContent: htmlDocument,
  };
}
