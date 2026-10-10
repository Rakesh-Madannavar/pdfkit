import React, { useState, useEffect } from 'react';
import { Stamp, Settings2, ArrowRight } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { addWatermarkToPdf } from '../utils/pdfWatermark';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { formatBytes } from '../utils/download';
import { ToolId, ProcessResult } from '../types/pdf';

interface WatermarkPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const WatermarkPage: React.FC<WatermarkPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('watermark')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Watermark Settings
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const [colorHex, setColorHex] = useState('#dc2626');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'PREVIEW'];

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
    } catch (err: any) {
      console.error('Watermark load error:', err);
      setError('Could not load PDF document.');
    }
  };

  const handleApplyWatermark = async () => {
    if (!buffer || !file) return;
    if (!text.trim()) {
      setError('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Watermarking document...');
    setError(null);

    try {
      const { blob, pageCount: processedCount } = await addWatermarkToPdf(buffer, {
        text,
        opacity,
        rotation,
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
        filename: `${cleanName}_watermarked.pdf`,
        fileSize: blob.size,
        itemCount: processedCount,
      });
    } catch (err: any) {
      console.error('Watermark error:', err);
      setError(err.message || 'Failed to apply watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Confidential_Brief.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Add Watermark to PDF Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages watermarked"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'rotate',
            label: 'Rotate or orient pages if needed',
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
          {/* Left/Middle: Interactive Visual Watermark Canvas Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                {file.name} ({formatBytes(file.size)})
              </span>
              <span className="text-slate-500 font-mono">
                {pageCount} {pageCount === 1 ? 'page' : 'pages'} total
              </span>
            </div>

            {/* Visual sheet simulation with watermark */}
            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-8 dark:border-slate-800 dark:bg-slate-900/40 flex items-center justify-center min-h-[460px]">
              <div className="relative aspect-[1/1.414] w-80 max-w-full rounded-xl bg-white shadow-xl dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-6 flex items-center justify-center overflow-hidden">
                {/* Background sample lines to simulate real document */}
                <div className="absolute inset-6 opacity-15 pointer-events-none space-y-3">
                  <div className="h-4 bg-slate-400 rounded w-2/3" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                  <div className="h-2 bg-slate-300 rounded w-5/6" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                  <div className="h-2 bg-slate-300 rounded w-3/4" />
                  <div className="h-20 bg-slate-200 rounded w-full mt-4" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                  <div className="h-2 bg-slate-300 rounded w-4/5" />
                </div>

                {/* Stamped Watermark text rendering */}
                <div
                  className="font-extrabold tracking-wider select-none pointer-events-none text-center uppercase transition-all duration-150"
                  style={{
                    color: colorHex,
                    opacity: opacity,
                    transform: `rotate(${-rotation}deg)`,
                    fontSize: `${Math.round(fontSize * 0.65)}px`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {text || 'WATERMARK'}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              Live visual preview: watermark is centered and stamped across all {pageCount} pages
            </p>
          </div>

          {/* Right Configuration panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Settings2 className="h-4 w-4 text-rose-600" />
                <span>Watermark Settings</span>
              </div>

              {/* Watermark text input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 uppercase font-bold focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                {/* Preset quick buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setText(preset)}
                      className="px-2 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Transparency / Opacity</span>
                  <span className="font-mono text-[11px] text-slate-500">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={90}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => setOpacity(parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Font Size slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Font Size</span>
                  <span className="font-mono text-[11px] text-slate-500">{fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={84}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Rotation Angle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Orientation Angle
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation(45)}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      rotation === 45
                        ? 'border-rose-500 bg-rose-50/60 text-rose-700 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    45° Diagonal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(0)}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      rotation === 0
                        ? 'border-rose-500 bg-rose-50/60 text-rose-700 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    0° Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(90)}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      rotation === 90
                        ? 'border-rose-500 bg-rose-50/60 text-rose-700 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    90° Vertical
                  </button>
                </div>
              </div>

              {/* Color choices */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Watermark Color
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { hex: '#dc2626', name: 'Crimson Red' },
                    { hex: '#475569', name: 'Slate Gray' },
                    { hex: '#1e3a8a', name: 'Navy Blue' },
                    { hex: '#047857', name: 'Emerald Green' },
                    { hex: '#000000', name: 'Black' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorHex(c.hex)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        colorHex === c.hex ? 'scale-110 border-rose-500 ring-2 ring-rose-500/30' : 'border-white dark:border-slate-800'
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
                disabled={isProcessing || !text.trim()}
                onClick={handleApplyWatermark}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Add Watermark</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
