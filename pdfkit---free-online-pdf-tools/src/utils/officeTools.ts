import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { createZipFile } from './download';

// --- WORD TOOLS ---

export async function convertDocx(file: File): Promise<{ html: string; text: string; wordCount: number }> {
  const buffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });

  const rawText = textResult.value || '';
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

  return {
    html: htmlResult.value,
    text: rawText,
    wordCount,
  };
}

// --- PPT TOOLS (PPTX is a ZIP container) ---

export interface PptImageItem {
  name: string;
  blob: Blob;
  dataUrl: string;
}

export async function extractImagesFromPptx(file: File): Promise<{ images: PptImageItem[]; zipBlob?: Blob }> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const images: PptImageItem[] = [];

  const mediaFiles = Object.keys(zip.files).filter((path) =>
    path.startsWith('ppt/media/') && !zip.files[path].dir
  );

  for (const path of mediaFiles) {
    const zipEntry = zip.files[path];
    const blob = await zipEntry.async('blob');
    const filename = path.replace('ppt/media/', '');
    const dataUrl = URL.createObjectURL(blob);
    images.push({
      name: filename,
      blob,
      dataUrl,
    });
  }

  let zipBlob: Blob | undefined;
  if (images.length > 0) {
    zipBlob = await createZipFile(images.map((img) => ({ name: img.name, content: img.blob })));
  }

  return { images, zipBlob };
}

export async function extractTextFromPptx(file: File): Promise<{ fullText: string; slides: Array<{ slideNumber: number; text: string }> }> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Match slide XML files like ppt/slides/slide1.xml
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });

  const slides: Array<{ slideNumber: number; text: string }> = [];
  const fullTextParts: string[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const path = slidePaths[i];
    const xmlContent = await zip.files[path].async('string');

    // Parse all text enclosed in <a:t>...</a:t>
    const matches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
    const textPieces = matches.map((m) => m.replace(/<[^>]+>/g, '')).filter(Boolean);
    const slideText = textPieces.join(' ').replace(/\s+/g, ' ').trim();

    slides.push({
      slideNumber: i + 1,
      text: slideText,
    });
    fullTextParts.push(`--- Slide ${i + 1} ---\n${slideText}`);
  }

  return {
    fullText: fullTextParts.join('\n\n'),
    slides,
  };
}

// --- EXCEL TOOLS (SheetJS) ---

export async function convertExcelToCsv(file: File): Promise<{ csvText: string; blob: Blob; sheetNames: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const csvText = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });

  return {
    csvText,
    blob,
    sheetNames: workbook.SheetNames,
  };
}

export async function convertExcelToJson(file: File): Promise<{ jsonString: string; blob: Blob; rowCount: number }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet);
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  return {
    jsonString,
    blob,
    rowCount: jsonData.length,
  };
}

export async function convertExcelToHtml(file: File): Promise<{ htmlString: string; rowCount: number }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const htmlTable = XLSX.utils.sheet_to_html(firstSheet);
  const jsonData = XLSX.utils.sheet_to_json(firstSheet);

  return {
    htmlString: htmlTable,
    rowCount: jsonData.length,
  };
}

export async function removeExcelDuplicates(file: File): Promise<{ blob: Blob; originalRows: number; uniqueRows: number; duplicatesRemoved: number }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

  const seen = new Set<string>();
  const uniqueList: Record<string, any>[] = [];

  for (const row of rows) {
    const signature = JSON.stringify(row);
    if (!seen.has(signature)) {
      seen.add(signature);
      uniqueList.push(row);
    }
  }

  const newWorksheet = XLSX.utils.json_to_sheet(uniqueList);
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Deduplicated');

  const outBytes = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([outBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  return {
    blob,
    originalRows: rows.length,
    uniqueRows: uniqueList.length,
    duplicatesRemoved: rows.length - uniqueList.length,
  };
}
