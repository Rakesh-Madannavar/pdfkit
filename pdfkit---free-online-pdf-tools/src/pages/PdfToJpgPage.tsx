import React, { useState, useEffect } from 'react';
import { Image, FileArchive, ArrowRight, Settings2, Sparkles } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { convertPdfToImages } from '../utils/pdfToImage';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { formatBytes } from '../utils/download';
import { ToolId, ProcessResult, PdfPageItem } from '../types/pdf';

interface PdfToJpgPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const PdfToJpgPage: React.FC<PdfToJpgPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('pdf-to-jpg')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [qualityPreset, setQualityPreset] = useState<'standard' | 'high' | 'ultra'>('high');
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
      setPageCount(count);

      const items: PdfPageItem[] = [];
      for (let i = 1; i <= count; i++) {
        items.push({
          id: `page-${i}`,
          originalPageIndex: i - 1,
          displayPageNumber: i,
          rotation: 0,
        });
      }
      setPages(items);

      // Render thumbnails
      for (let i = 1; i <= count; i++) {
        try {
          const { dataUrl } = await renderPageToDataUrl(pdfDoc, i, 160);
          setPages((prev) =>
            prev.map((p) => (p.displayPageNumber === i ? { ...p, thumbnailUrl: dataUrl } : p))
          );
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('PDF to image load error:', err);
      setError('Could not load PDF document.');
    }
  };

  const handleConvert = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(5);
    setProgressMessage('Starting image rendering pipeline...');
    setError(null);

    try {
      let dpiScale = 2;
      let quality = 0.9;

      if (qualityPreset === 'standard') {
        dpiScale = 1.2;
        quality = 0.8;
      } else if (qualityPreset === 'ultra') {
        dpiScale = 3;
        quality = 0.95;
      }

      const res = await convertPdfToImages(buffer, file.name, {
        format,
        dpiScale,
        quality,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
      });

      if (res.isZip && res.zipBlob) {
        setResult({
          blob: res.zipBlob,
          filename: res.zipFilename || 'pdf_images.zip',
          isZip: true,
          fileSize: res.zipBlob.size,
          itemCount: res.pageCount,
        });
      } else if (res.singleBlob) {
        setResult({
          blob: res.singleBlob,
          filename: res.singleFilename || `page_001.${format === 'png' ? 'png' : 'jpg'}`,
          isZip: false,
          fileSize: res.singleBlob.size,
          itemCount: 1,
        });
      }
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to render PDF pages into images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Infographic.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'PDF to JPG - Convert PDF to Images Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          isZip={result.isZip}
          itemCount={result.itemCount}
          itemCountLabel={result.isZip ? 'Images in ZIP' : 'Image file'}
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'jpg-to-pdf',
            label: 'Convert images back to a single PDF',
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thumbnails preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                {file.name} ({formatBytes(file.size)})
              </span>
              <span className="text-slate-500 font-mono">
                {pageCount} {pageCount === 1 ? 'page to convert' : 'pages to convert'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[540px] overflow-y-auto p-1">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
                >
                  <div className="relative aspect-[1/1.3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={`Page ${p.displayPageNumber}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Page {p.displayPageNumber}</span>
                    )}
                  </div>
                  <div className="mt-1.5 text-center text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Page {p.displayPageNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Configuration panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Settings2 className="h-4 w-4 text-violet-600" />
                <span>Conversion Settings</span>
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Image Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                      format === 'jpeg'
                        ? 'border-violet-500 bg-violet-50/60 text-violet-700 dark:border-violet-500/60 dark:bg-violet-950/40 dark:text-violet-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    JPG (Smaller size)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                      format === 'png'
                        ? 'border-violet-500 bg-violet-50/60 text-violet-700 dark:border-violet-500/60 dark:bg-violet-950/40 dark:text-violet-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                </div>
              </div>

              {/* Quality / Resolution preset */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resolution & Quality
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setQualityPreset('standard')}
                    className={`flex items-start gap-2.5 w-full rounded-xl border p-3 text-left transition-all ${
                      qualityPreset === 'standard'
                        ? 'border-violet-500 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/20 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">
                      <div className="font-semibold">Standard (~100 DPI)</div>
                      <div className="text-[11px] text-slate-500">Fast rendering, lightweight images for web use</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQualityPreset('high')}
                    className={`flex items-start gap-2.5 w-full rounded-xl border p-3 text-left transition-all ${
                      qualityPreset === 'high'
                        ? 'border-violet-500 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/20 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>High (~200 DPI)</span>
                        <span className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 px-1.5 py-0.2 rounded font-medium">Recommended</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Super crisp text and illustrations for presentations</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQualityPreset('ultra')}
                    className={`flex items-start gap-2.5 w-full rounded-xl border p-3 text-left transition-all ${
                      qualityPreset === 'ultra'
                        ? 'border-violet-500 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/20 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">
                      <div className="font-semibold">Ultra Print (~300 DPI)</div>
                      <div className="text-[11px] text-slate-500">Maximum fidelity for printing and archival</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              {/* Convert action button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConvert}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Convert to {format.toUpperCase()}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
