import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowRight, Grid3X3, Layers } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { ThumbnailGrid } from '../components/ThumbnailGrid';
import { organizePdf } from '../utils/pdfOrganize';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId, ProcessResult, PdfPageItem } from '../types/pdf';

interface OrganizePdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const OrganizePdfPage: React.FC<OrganizePdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('organize')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [initialPagesSnapshot, setInitialPagesSnapshot] = useState<PdfPageItem[]>([]);
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

      const initial: PdfPageItem[] = [];
      for (let i = 1; i <= count; i++) {
        initial.push({
          id: `page-${i}-${Date.now()}`,
          originalPageIndex: i - 1,
          displayPageNumber: i,
          rotation: 0,
        });
      }
      setPages(initial);
      setInitialPagesSnapshot(initial);

      // Render thumbnails
      for (let i = 1; i <= count; i++) {
        try {
          const { dataUrl } = await renderPageToDataUrl(pdfDoc, i, 200);
          setPages((prev) =>
            prev.map((p) => (p.originalPageIndex === i - 1 ? { ...p, thumbnailUrl: dataUrl } : p))
          );
          setInitialPagesSnapshot((prev) =>
            prev.map((p) => (p.originalPageIndex === i - 1 ? { ...p, thumbnailUrl: dataUrl } : p))
          );
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Organize load error:', err);
      setError('Could not load PDF document.');
    }
  };

  const handleRotate = (id: string, degreesToAdd: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newAngle = ((p.rotation + degreesToAdd) % 360 + 360) % 360;
        return { ...p, rotation: newAngle };
      })
    );
  };

  const handleDelete = (id: string) => {
    if (pages.length <= 1) {
      setError('At least one page must remain in the document.');
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicate = (id: string) => {
    const targetIdx = pages.findIndex((p) => p.id === id);
    if (targetIdx === -1) return;
    const target = pages[targetIdx];
    const clone: PdfPageItem = {
      ...target,
      id: `${target.id}-copy-${Date.now()}`,
    };
    const updated = [...pages];
    updated.splice(targetIdx + 1, 0, clone);
    setPages(updated);
  };

  const handleReset = () => {
    setPages(initialPagesSnapshot);
  };

  const handleSaveOrganized = async () => {
    if (!buffer || !file || pages.length === 0) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Compiling reorganized PDF...');
    setError(null);

    try {
      const pageSequence = pages.map((p) => ({
        originalIndex: p.originalPageIndex,
        rotation: p.rotation,
      }));

      const { blob, pageCount } = await organizePdf(buffer, pageSequence, (p, msg) => {
        setProgress(p);
        setProgressMessage(msg);
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_organized.pdf`,
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Organize error:', err);
      setError(err.message || 'Failed to save organized PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Slides.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Organize PDF - Reorder, Delete & Duplicate Pages | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages in document"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'watermark',
            label: 'Add a watermark stamp to this organized file',
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
              label: 'Try with 3-Page Sample PDF',
              action: handleLoadSample,
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} in Layout
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drag thumbnails to reorder. Use duplicate, rotate, or delete on any card.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || pages.length === 0}
                onClick={handleSaveOrganized}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-95"
              >
                <span>Save Organized PDF</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <ProgressBar progress={progress} statusMessage={progressMessage} />
          )}

          {/* Draggable Thumbnail Grid */}
          <ThumbnailGrid
            items={pages}
            onReorder={setPages}
            onRotate={handleRotate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            allowRotate={true}
            allowDelete={true}
            allowDuplicate={true}
          />
        </div>
      )}
    </ToolLayout>
  );
};
