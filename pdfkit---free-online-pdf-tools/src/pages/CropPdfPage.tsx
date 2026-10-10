import React, { useState, useEffect } from 'react';
import { Crop, ArrowRight, Settings2 } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { cropPdf, CropMargins } from '../utils/pdfCrop';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { formatBytes } from '../utils/download';
import { ToolId, ProcessResult } from '../types/pdf';

interface CropPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const CropPdfPage: React.FC<CropPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('crop')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Margins in points (72 points = 1 inch)
  const [margins, setMargins] = useState<CropMargins>({
    top: 36,
    bottom: 36,
    left: 36,
    right: 36,
  });

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
      setPageCount(pdfDoc.numPages);
      const { dataUrl } = await renderPageToDataUrl(pdfDoc, 1, 350);
      setThumbnailUrl(dataUrl);
    } catch {
      setError('Could not load PDF document.');
    }
  };

  const handleCrop = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Cropping document pages...');
    setError(null);

    try {
      const { blob, pageCount: count } = await cropPdf(buffer, margins, (p, msg) => {
        setProgress(p);
        setProgressMessage(msg);
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_cropped.pdf`,
        fileSize: blob.size,
        itemCount: count,
      });
    } catch (err: any) {
      console.error('Crop error:', err);
      setError(err.message || 'Failed to crop PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Scan_With_Borders.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Crop PDF - Trim PDF Margins Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages cropped"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'compress',
            label: 'Compress your cropped PDF file',
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</span>
              <span className="font-mono text-slate-500">{pageCount} pages</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-6 dark:border-slate-800 dark:bg-slate-900/40 flex flex-col items-center justify-center">
              <div className="relative aspect-[1/1.414] w-72 max-w-full rounded-xl bg-white shadow-xl dark:bg-slate-800 border border-slate-200/80 overflow-hidden">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt="Page preview"
                    className="h-full w-full object-contain pointer-events-none select-none"
                  />
                )}

                {/* Shaded crop margins overlay */}
                <div
                  className="absolute inset-0 pointer-events-none border-2 border-indigo-500 bg-indigo-500/10 transition-all"
                  style={{
                    top: `${Math.min(30, margins.top / 4)}%`,
                    bottom: `${Math.min(30, margins.bottom / 4)}%`,
                    left: `${Math.min(30, margins.left / 4)}%`,
                    right: `${Math.min(30, margins.right / 4)}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                The highlighted inside area represents the kept content.
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Crop className="h-4 w-4 text-indigo-600" />
                <span>Crop Margins (Points)</span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMargins({ top: 20, bottom: 20, left: 20, right: 20 })}
                  className="rounded-lg border border-slate-200 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Small (20pt)
                </button>
                <button
                  type="button"
                  onClick={() => setMargins({ top: 40, bottom: 40, left: 40, right: 40 })}
                  className="rounded-lg border border-slate-200 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Medium (40pt)
                </button>
                <button
                  type="button"
                  onClick={() => setMargins({ top: 60, bottom: 60, left: 60, right: 60 })}
                  className="rounded-lg border border-slate-200 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Large (60pt)
                </button>
              </div>

              {/* Custom 4-side inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Top Margin</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={margins.top}
                    onChange={(e) => setMargins({ ...margins, top: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Bottom Margin</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={margins.bottom}
                    onChange={(e) => setMargins({ ...margins, bottom: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Left Margin</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={margins.left}
                    onChange={(e) => setMargins({ ...margins, left: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Right Margin</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={margins.right}
                    onChange={(e) => setMargins({ ...margins, right: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCrop}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Apply Crop to PDF</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
