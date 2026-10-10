import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Layers, 
  FileArchive, 
  FileCheck, 
  Info,
  ArrowRight
} from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { formatBytes } from '../utils/download';
import { splitPdf, parsePageRangeString } from '../utils/pdfSplit';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId, ProcessResult, PdfPageItem } from '../types/pdf';

interface SplitPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const SplitPdfPage: React.FC<SplitPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('split')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [splitMode, setSplitMode] = useState<'custom-ranges' | 'extract-all' | 'single-range'>('custom-ranges');
  const [rangeInput, setRangeInput] = useState('1');
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

      // Default range
      setRangeInput(count > 1 ? `1-${Math.min(count, 3)}` : '1');

      // Load page items with thumbnails
      const initialItems: PdfPageItem[] = [];
      for (let i = 1; i <= count; i++) {
        initialItems.push({
          id: `page-${i}`,
          originalPageIndex: i - 1,
          displayPageNumber: i,
          rotation: 0,
        });
      }
      setPages(initialItems);

      // Render thumbnails asynchronously
      for (let i = 1; i <= count; i++) {
        try {
          const { dataUrl } = await renderPageToDataUrl(pdfDoc, i, 160);
          setPages((prev) =>
            prev.map((p) => (p.displayPageNumber === i ? { ...p, thumbnailUrl: dataUrl } : p))
          );
        } catch {
          // ignore individual thumbnail failure
        }
      }
    } catch (err: any) {
      console.error('Split load error:', err);
      setError('Could not read PDF. Ensure the file is not corrupted or password-protected.');
    }
  };

  // Calculate parsed page indices for current range string
  const selectedPageNumbers = React.useMemo(() => {
    if (!rangeInput || splitMode === 'extract-all') return [];
    try {
      return parsePageRangeString(rangeInput, pageCount);
    } catch {
      return [];
    }
  }, [rangeInput, pageCount, splitMode]);

  const handleSplit = async () => {
    if (!buffer || !file) return;

    if (splitMode !== 'extract-all' && selectedPageNumbers.length === 0) {
      setError(`Please enter a valid page range between 1 and ${pageCount}.`);
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setProgressMessage('Initializing split engine...');
    setError(null);

    try {
      const res = await splitPdf(buffer, file.name, splitMode, {
        rangeString: rangeInput,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
      });

      setResult({
        blob: res.blob,
        filename: res.filename,
        isZip: res.isZip,
        fileSize: res.blob.size,
        itemCount: res.filesCount,
      });
    } catch (err: any) {
      console.error('Split error:', err);
      setError(err.message || 'Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_MultiPage_Doc.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Split PDF - Extract Pages or Ranges Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          isZip={result.isZip}
          itemCount={result.itemCount}
          itemCountLabel={result.isZip ? 'PDF files inside ZIP' : 'Pages in document'}
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'merge',
            label: 'Merge extracted files with other documents',
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
          {/* Left/Middle: Page Thumbnails Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                {file.name} ({formatBytes(file.size)})
              </span>
              <span className="text-slate-500 font-mono">
                {pageCount} {pageCount === 1 ? 'page' : 'pages'} total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto p-1">
              {pages.map((p) => {
                const isSelected = splitMode === 'extract-all' || selectedPageNumbers.includes(p.displayPageNumber);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (splitMode !== 'extract-all') {
                        // Toggle page in range
                        const current = new Set(selectedPageNumbers);
                        if (current.has(p.displayPageNumber)) {
                          current.delete(p.displayPageNumber);
                        } else {
                          current.add(p.displayPageNumber);
                        }
                        const arr = Array.from(current).sort((a, b) => a - b);
                        setRangeInput(arr.join(', '));
                      }
                    }}
                    className={`relative cursor-pointer rounded-xl border p-2 transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white opacity-40 dark:border-slate-800 dark:bg-slate-900 hover:opacity-80'
                    }`}
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
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span>Page {p.displayPageNumber}</span>
                      {isSelected && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Selected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Split Settings Panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Split Options
              </h3>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Split Mode
                </label>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSplitMode('custom-ranges')}
                    className={`flex items-start gap-3 w-full rounded-xl border p-3 text-left transition-all ${
                      splitMode === 'custom-ranges'
                        ? 'border-rose-500 bg-rose-50/50 dark:border-rose-500/60 dark:bg-rose-950/20 text-rose-950 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Scissors className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <div className="text-xs font-semibold">Split into Range Files (ZIP)</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        e.g., 1-2, 3 split into separate files
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('single-range')}
                    className={`flex items-start gap-3 w-full rounded-xl border p-3 text-left transition-all ${
                      splitMode === 'single-range'
                        ? 'border-rose-500 bg-rose-50/50 dark:border-rose-500/60 dark:bg-rose-950/20 text-rose-950 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Layers className="h-4 w-4 shrink-0 mt-0.5 text-orange-600" />
                    <div>
                      <div className="text-xs font-semibold">Extract Pages into 1 Single PDF</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Merge selected pages into one new PDF
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('extract-all')}
                    className={`flex items-start gap-3 w-full rounded-xl border p-3 text-left transition-all ${
                      splitMode === 'extract-all'
                        ? 'border-rose-500 bg-rose-50/50 dark:border-rose-500/60 dark:bg-rose-950/20 text-rose-950 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileArchive className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-semibold">Extract All Pages (ZIP)</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Every single page saved as its own PDF
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Range input if custom range */}
              {splitMode !== 'extract-all' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page Ranges (1 to {pageCount})
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7-9"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setRangeInput(`1-${Math.min(pageCount, 2)}`)}
                      className="px-2 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      First pages
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const odd = [];
                        for (let i = 1; i <= pageCount; i += 2) odd.push(i);
                        setRangeInput(odd.join(', '));
                      }}
                      className="px-2 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Odd pages
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const even = [];
                        for (let i = 2; i <= pageCount; i += 2) even.push(i);
                        setRangeInput(even.join(', '));
                      }}
                      className="px-2 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Even pages
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeInput(`1-${pageCount}`)}
                      className="px-2 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      All
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {selectedPageNumbers.length} pages currently selected
                    </span>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              {/* Split Action */}
              <button
                type="button"
                disabled={isProcessing || (splitMode !== 'extract-all' && selectedPageNumbers.length === 0)}
                onClick={handleSplit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Split PDF</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
