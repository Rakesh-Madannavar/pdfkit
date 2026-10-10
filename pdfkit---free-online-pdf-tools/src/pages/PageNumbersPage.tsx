import React, { useState, useEffect } from 'react';
import { Hash, Settings2, ArrowRight } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { 
  addPageNumbersToPdf, 
  PageNumberPosition, 
  PageNumberFormat 
} from '../utils/pdfPageNumbers';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { formatBytes } from '../utils/download';
import { ToolId, ProcessResult } from '../types/pdf';

interface PageNumbersPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const PageNumbersPage: React.FC<PageNumbersPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('page-numbers')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [firstPageThumbnail, setFirstPageThumbnail] = useState<string | null>(null);

  // Settings
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page-n-of-total');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [colorHex, setColorHex] = useState('#374151');

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

      const { dataUrl } = await renderPageToDataUrl(pdfDoc, 1, 260);
      setFirstPageThumbnail(dataUrl);
    } catch (err: any) {
      console.error('Page numbers load error:', err);
      setError('Could not load PDF document.');
    }
  };

  const handleApplyNumbers = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Stamping page numbers...');
    setError(null);

    try {
      const { blob, pageCount: processedCount } = await addPageNumbersToPdf(buffer, {
        position,
        format,
        startNumber: Math.max(1, startNumber),
        fontSize,
        colorHex,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_numbered.pdf`,
        fileSize: blob.size,
        itemCount: processedCount,
      });
    } catch (err: any) {
      console.error('Page numbers error:', err);
      setError(err.message || 'Failed to stamp page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Report.pdf');
    handleFileSelected([sample]);
  };

  // Preview label calculation
  const getSampleLabel = () => {
    const n = startNumber;
    const total = pageCount || 10;
    switch (format) {
      case 'page-n': return `Page ${n}`;
      case 'page-n-of-total': return `Page ${n} of ${total}`;
      case 'n': return `${n}`;
      case 'n-slash-total': return `${n} / ${total}`;
      case 'dash-n-dash': return `- ${n} -`;
      default: return `${n}`;
    }
  };

  useEffect(() => {
    document.title = 'Add Page Numbers to PDF - Free Online Tool | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages numbered"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'watermark',
            label: 'Add a watermark to this numbered PDF',
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
          {/* Left/Middle: Live Visual Simulation of Page */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                {file.name} ({formatBytes(file.size)})
              </span>
              <span className="text-slate-500 font-mono">
                {pageCount} pages will be stamped
              </span>
            </div>

            {/* Visual sheet simulation */}
            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-8 dark:border-slate-800 dark:bg-slate-900/40 flex items-center justify-center">
              <div className="relative aspect-[1/1.414] w-72 max-w-full rounded-xl bg-white shadow-xl dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-6 flex flex-col justify-between">
                {/* Background ghost content */}
                <div className="absolute inset-4 opacity-15 pointer-events-none space-y-3">
                  <div className="h-4 bg-slate-400 rounded w-1/2" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                  <div className="h-2 bg-slate-300 rounded w-5/6" />
                  <div className="h-2 bg-slate-300 rounded w-4/6" />
                  <div className="h-28 bg-slate-200 rounded w-full mt-4" />
                </div>

                {/* Top slots */}
                <div className="flex items-center justify-between z-10 w-full">
                  <div className={`p-1 rounded text-xs transition-all ${position === 'top-left' ? 'font-bold underline ring-2 ring-teal-500/50 bg-teal-50 dark:bg-teal-950/40' : 'text-slate-300 opacity-20'}`}>
                    {position === 'top-left' && getSampleLabel()}
                  </div>
                  <div className={`p-1 rounded text-xs transition-all ${position === 'top-center' ? 'font-bold underline ring-2 ring-teal-500/50 bg-teal-50 dark:bg-teal-950/40' : 'text-slate-300 opacity-20'}`}>
                    {position === 'top-center' && getSampleLabel()}
                  </div>
                  <div className={`p-1 rounded text-xs transition-all ${position === 'top-right' ? 'font-bold underline ring-2 ring-teal-500/50 bg-teal-50 dark:bg-teal-950/40' : 'text-slate-300 opacity-20'}`}>
                    {position === 'top-right' && getSampleLabel()}
                  </div>
                </div>

                {/* Bottom slots */}
                <div className="flex items-center justify-between z-10 w-full">
                  <div className={`p-1 rounded text-xs transition-all ${position === 'bottom-left' ? 'font-bold underline ring-2 ring-teal-500/50 bg-teal-50 dark:bg-teal-950/40' : 'text-slate-300 opacity-20'}`}>
                    {position === 'bottom-left' && getSampleLabel()}
                  </div>
                  <div className={`p-1 rounded text-xs transition-all ${position === 'bottom-center' ? 'font-bold underline ring-2 ring-teal-500/50 bg-teal-50 dark:bg-teal-950/40' : 'text-slate-300 opacity-20'}`}>
                    {position === 'bottom-center' && getSampleLabel()}
                  </div>
                  <div className={`p-1 rounded text-xs transition-all ${position === 'bottom-right' ? 'font-bold underline ring-2 ring-teal-500/50 bg-teal-50 dark:bg-teal-950/40' : 'text-slate-300 opacity-20'}`}>
                    {position === 'bottom-right' && getSampleLabel()}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              Live layout preview: &quot;{getSampleLabel()}&quot; positioned at {position.replace('-', ' ')}
            </p>
          </div>

          {/* Right Configuration Panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Settings2 className="h-4 w-4 text-teal-600" />
                <span>Page Number Options</span>
              </div>

              {/* Position selector 3x2 grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Position on Page
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosition('top-left')}
                    className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                      position === 'top-left' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Top Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('top-center')}
                    className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                      position === 'top-center' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Top Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('top-right')}
                    className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                      position === 'top-right' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Top Right
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-left')}
                    className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                      position === 'bottom-left' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bottom Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-center')}
                    className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                      position === 'bottom-center' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bottom Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-right')}
                    className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                      position === 'bottom-right' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bottom Right
                  </button>
                </div>
              </div>

              {/* Number format */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Format Style
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'page-n-of-total', label: `Page 1 of ${pageCount || 10}` },
                    { id: 'page-n', label: 'Page 1' },
                    { id: 'n', label: '1' },
                    { id: 'n-slash-total', label: `1 / ${pageCount || 10}` },
                    { id: 'dash-n-dash', label: '- 1 -' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormat(fmt.id as PageNumberFormat)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs text-left transition-all ${
                        format === fmt.id
                          ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{fmt.label}</span>
                      {format === fmt.id && <span className="text-[10px] text-teal-600">Active</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starting number & Font Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    First Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Font Size</span>
                    <span className="font-mono text-[11px] text-slate-500">{fontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={20}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { hex: '#374151', name: 'Dark Slate' },
                    { hex: '#000000', name: 'Black' },
                    { hex: '#dc2626', name: 'Red' },
                    { hex: '#2563eb', name: 'Blue' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorHex(c.hex)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        colorHex === c.hex ? 'scale-110 border-teal-500 ring-2 ring-teal-500/30' : 'border-white dark:border-slate-800'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              {/* Action */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApplyNumbers}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Add Page Numbers</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
