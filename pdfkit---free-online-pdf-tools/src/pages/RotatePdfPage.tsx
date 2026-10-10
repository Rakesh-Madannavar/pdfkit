import React, { useState, useEffect } from 'react';
import { RotateCw, RotateCcw, ArrowRight } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { ThumbnailGrid } from '../components/ThumbnailGrid';
import { rotatePdf, PageRotationMap } from '../utils/pdfRotate';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId, ProcessResult, PdfPageItem } from '../types/pdf';

interface RotatePdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const RotatePdfPage: React.FC<RotatePdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('rotate')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);

    try {
      const buf = await selected.arrayBuffer();
      setBuffer(buf);
      const pdfDoc = await loadPdfDocument(buf);
      const count = pdfDoc.numPages;

      const initialPages: PdfPageItem[] = [];
      for (let i = 1; i <= count; i++) {
        initialPages.push({
          id: `page-${i}`,
          originalPageIndex: i - 1,
          displayPageNumber: i,
          rotation: 0,
        });
      }
      setPages(initialPages);

      // Render thumbnails asynchronously
      for (let i = 1; i <= count; i++) {
        try {
          const { dataUrl } = await renderPageToDataUrl(pdfDoc, i, 200);
          setPages((prev) =>
            prev.map((p) => (p.displayPageNumber === i ? { ...p, thumbnailUrl: dataUrl } : p))
          );
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Rotate load error:', err);
      setError('Could not load PDF document.');
    }
  };

  const rotatePage = (id: string, degreesToAdd: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newAngle = ((p.rotation + degreesToAdd) % 360 + 360) % 360;
        return { ...p, rotation: newAngle };
      })
    );
  };

  const rotateAll = (degreesToAdd: number) => {
    setPages((prev) =>
      prev.map((p) => {
        const newAngle = ((p.rotation + degreesToAdd) % 360 + 360) % 360;
        return { ...p, rotation: newAngle };
      })
    );
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const handleSaveRotated = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Rotating document pages...');
    setError(null);

    try {
      const pageRotationMap: PageRotationMap = {};
      pages.forEach((p) => {
        if (p.rotation !== 0) {
          pageRotationMap[p.originalPageIndex] = p.rotation;
        }
      });

      const { blob, pageCount } = await rotatePdf(buffer, pageRotationMap, 0, (p, msg) => {
        setProgress(p);
        setProgressMessage(msg);
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_rotated.pdf`,
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Rotate error:', err);
      setError(err.message || 'Failed to rotate PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_UpsideDown.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Rotate PDF - Rotate PDF Pages Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages total"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'organize',
            label: 'Organize or reorder other pages in this document',
          }}
        />
      ) : !file ? (
        <div className="mx-auto max-w-2xl">
          <FileDropzone
            accept={tool.accepts}
            acceptLabel={tool.acceptLabel}
            multiple={false}
            onFilesSelected={handleFileSelected}
            sampleAction={{
              label: 'Try with Sample PDF',
              action: handleLoadSample,
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click rotate on individual pages or use the batch buttons below
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => rotateAll(-90)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>All Left 90°</span>
              </button>

              <button
                type="button"
                onClick={() => rotateAll(90)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>All Right 90°</span>
              </button>

              <button
                type="button"
                onClick={resetAllRotations}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Reset
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveRotated}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-95"
              >
                <span>Save Rotations</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <ProgressBar progress={progress} statusMessage={progressMessage} />
          )}

          {/* Pages Grid */}
          <ThumbnailGrid
            items={pages}
            onReorder={setPages}
            onRotate={(id) => rotatePage(id, 90)}
            allowRotate={true}
            allowDelete={false}
            allowDuplicate={false}
          />
        </div>
      )}
    </ToolLayout>
  );
};
