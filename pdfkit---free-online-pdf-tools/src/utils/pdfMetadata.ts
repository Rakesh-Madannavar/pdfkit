import { PDFDocument } from 'pdf-lib';

export interface PdfMetadataInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Reads existing metadata from a PDF document
 */
export async function readPdfMetadata(buffer: ArrayBuffer): Promise<PdfMetadataInfo> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: pdfDoc.getKeywords() ? pdfDoc.getKeywords()?.split(/[,;]\s*/) : [],
    producer: pdfDoc.getProducer() || '',
    creator: pdfDoc.getCreator() || '',
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
  };
}

/**
 * Updates metadata on a PDF and returns the updated PDF Blob
 */
export async function updatePdfMetadata(
  buffer: ArrayBuffer,
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    producer: string;
    creator: string;
  }
): Promise<{ blob: Blob; pageCount: number }> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  pdfDoc.setTitle(metadata.title || '');
  pdfDoc.setAuthor(metadata.author || '');
  pdfDoc.setSubject(metadata.subject || '');
  pdfDoc.setProducer(metadata.producer || 'PDFKit');
  pdfDoc.setCreator(metadata.creator || 'PDFKit');

  const kwArray = metadata.keywords
    ? metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];
  pdfDoc.setKeywords(kwArray);
  pdfDoc.setModificationDate(new Date());

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });

  return {
    blob,
    pageCount: pdfDoc.getPageCount(),
  };
}
