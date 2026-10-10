import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Generates a clean 3-page sample PDF document in memory for quick testing
 */
export async function generateSamplePdf(name = 'Sample_Document.pdf'): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = [
    { title: 'Page 1: Project Overview', body: 'Welcome to PDFKit! This is an automatically generated sample document. You can merge, split, rotate, organize, or watermark this file 100% locally.' },
    { title: 'Page 2: Financial Summary', body: 'This sample page contains secondary data for testing multi-page operations such as reordering, extracting specific page ranges, and adding watermarks.' },
    { title: 'Page 3: Conclusion & Next Steps', body: 'Final sheet in the demonstration set. Use this to test PDF to JPG conversion, page numbering stamping, and custom rotations.' },
  ];

  for (let i = 0; i < colors.length; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const item = colors[i];

    // Decorative top header bar
    page.drawRectangle({
      x: 50,
      y: 780,
      width: 495.28,
      height: 4,
      color: rgb(0.9, 0.25, 0.2),
    });

    page.drawText(item.title, {
      x: 50,
      y: 740,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.15, 0.2),
    });

    page.drawText(item.body, {
      x: 50,
      y: 690,
      size: 12,
      font: font,
      color: rgb(0.3, 0.35, 0.4),
      lineHeight: 18,
      maxWidth: 490,
    });

    // Box illustration
    page.drawRectangle({
      x: 50,
      y: 350,
      width: 495.28,
      height: 280,
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
      color: rgb(0.97, 0.98, 0.99),
    });

    page.drawText(`Sample Chart / Document Content Area [Page ${i + 1}]`, {
      x: 120,
      y: 480,
      size: 13,
      font: boldFont,
      color: rgb(0.5, 0.55, 0.6),
    });

    page.drawText(`PDFKit Client-Side Engine · Confidential Mock Data`, {
      x: 50,
      y: 50,
      size: 9,
      font: font,
      color: rgb(0.6, 0.65, 0.7),
    });
  }

  const bytes = await pdfDoc.save();
  return new File([bytes as unknown as BlobPart], name, { type: 'application/pdf' });
}
