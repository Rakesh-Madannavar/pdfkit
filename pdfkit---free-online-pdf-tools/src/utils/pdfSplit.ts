import { PDFDocument } from 'pdf-lib';
import { createZipFile } from './download';

export interface SplitResult {
  blob: Blob;
  filename: string;
  isZip: boolean;
  pageCount: number;
  filesCount: number;
}

/**
 * Parses page range string (e.g., "1-3, 5, 7-10") into array of 1-based page numbers
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range segment: "${part}"`);
      }
      if (start > end) {
        throw new Error(`Invalid range: start page ${start} is greater than end page ${end}`);
      }

      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= maxPages) {
          pagesSet.add(i);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: "${part}"`);
      }
      if (pageNum >= 1 && pageNum <= maxPages) {
        pagesSet.add(pageNum);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Parses range string into separate range chunks (e.g., "1-3, 5, 7-9" -> [[1,2,3], [5], [7,8,9]])
 */
export function parsePageRangeGroups(rangeStr: string, maxPages: number): { label: string; pages: number[] }[] {
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);
  const groups: { label: string; pages: number[] }[] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(maxPages, parseInt(endStr, 10));

      if (isNaN(start) || isNaN(end) || start > end) continue;

      const pages: number[] = [];
      for (let i = start; i <= end; i++) pages.push(i);
      if (pages.length > 0) {
        groups.push({ label: `${start}-${end}`, pages });
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        groups.push({ label: `page-${pageNum}`, pages: [pageNum] });
      }
    }
  }

  return groups;
}

/**
 * Extracts specified pages into a single PDF
 */
export async function extractPagesToSinglePdf(
  pdfBuffer: ArrayBuffer,
  pageNumbers: number[] // 1-based
): Promise<{ blob: Blob; pageCount: number }> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  // Convert to 0-based indices and filter valid
  const indices = pageNumbers
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < srcDoc.getPageCount());

  if (indices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  return {
    blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: indices.length,
  };
}

/**
 * Splits PDF by ranges or extracts every page into a ZIP archive
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  baseFilename: string,
  mode: 'extract-all' | 'custom-ranges' | 'single-range',
  options: {
    rangeString?: string;
    onProgress?: (percent: number, message: string) => void;
  } = {}
): Promise<SplitResult> {
  const { rangeString = '', onProgress } = options;
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const cleanName = baseFilename.replace(/\.[^/.]+$/, '');

  if (mode === 'single-range') {
    if (onProgress) onProgress(20, 'Extracting selected pages...');
    const pages = parsePageRangeString(rangeString, totalPages);
    if (pages.length === 0) {
      throw new Error(`No valid pages match "${rangeString}". Document has ${totalPages} pages.`);
    }
    const { blob, pageCount } = await extractPagesToSinglePdf(pdfBuffer, pages);
    if (onProgress) onProgress(100, 'Done!');
    return {
      blob,
      filename: `${cleanName}_extracted.pdf`,
      isZip: false,
      pageCount,
      filesCount: 1,
    };
  }

  if (mode === 'custom-ranges') {
    const groups = parsePageRangeGroups(rangeString, totalPages);
    if (groups.length === 0) {
      throw new Error(`No valid range segments found in "${rangeString}".`);
    }

    if (groups.length === 1) {
      // Only one range segment, download directly as single PDF
      const { blob, pageCount } = await extractPagesToSinglePdf(pdfBuffer, groups[0].pages);
      return {
        blob,
        filename: `${cleanName}_${groups[0].label}.pdf`,
        isZip: false,
        pageCount,
        filesCount: 1,
      };
    }

    // Multiple ranges -> build zip
    const filesToZip: Array<{ name: string; content: Uint8Array }> = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (onProgress) {
        onProgress(
          Math.round(((i + 1) / groups.length) * 80),
          `Creating range ${g.label} (${i + 1}/${groups.length})...`
        );
      }
      const newDoc = await PDFDocument.create();
      const indices = g.pages.map((p) => p - 1);
      const copied = await newDoc.copyPages(srcDoc, indices);
      copied.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      filesToZip.push({
        name: `${cleanName}_${g.label}.pdf`,
        content: bytes,
      });
    }

    if (onProgress) onProgress(90, 'Packaging ZIP archive...');
    const zipBlob = await createZipFile(filesToZip);
    if (onProgress) onProgress(100, 'Done!');

    return {
      blob: zipBlob,
      filename: `${cleanName}_split_ranges.zip`,
      isZip: true,
      pageCount: totalPages,
      filesCount: filesToZip.length,
    };
  }

  // mode === 'extract-all'
  const filesToZip: Array<{ name: string; content: Uint8Array }> = [];
  for (let i = 0; i < totalPages; i++) {
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / totalPages) * 85),
        `Extracting page ${i + 1} of ${totalPages}...`
      );
    }
    const newDoc = await PDFDocument.create();
    const [copied] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(copied);
    const bytes = await newDoc.save();
    const padNum = String(i + 1).padStart(3, '0');
    filesToZip.push({
      name: `${cleanName}_page_${padNum}.pdf`,
      content: bytes,
    });
  }

  if (onProgress) onProgress(90, 'Generating ZIP package...');
  const zipBlob = await createZipFile(filesToZip);
  if (onProgress) onProgress(100, 'Done!');

  return {
    blob: zipBlob,
    filename: `${cleanName}_all_pages.zip`,
    isZip: true,
    pageCount: totalPages,
    filesCount: totalPages,
  };
}
