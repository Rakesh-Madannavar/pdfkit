import React, { useState, useEffect } from 'react';
import { Minimize2, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { compressPdf, CompressionLevel } from '../utils/pdfCompress';
import { formatBytes } from '../utils/download';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId, ProcessResult } from '../types/pdf';

interface CompressPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const CompressPdfPage: React.FC<CompressPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('compress')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [savingsPercent, setSavingsPercent] = useState<number>(0);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    try {
      const buf = await selected.arrayBuffer();
      setBuffer(buf);
      setOriginalSize(selected.size);
    } catch {
      setError('Could not load PDF document.');
    }
  };

  const handleCompress = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(10);
    setProgressMessage('Analyzing PDF internal structure...');
    setError(null);

    try {
      const res = await compressPdf(buffer, {
        level,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setSavingsPercent(res.savingsPercentage);
      setResult({
        blob: res.blob,
        filename: `${cleanName}_compressed.pdf`,
        fileSize: res.compressedSize,
        itemCount: res.pageCount,
      });
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Large_Doc.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Compress PDF - Reduce PDF Size Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <div className="space-y-6">
          {/* Savings banner */}
          <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center dark:bg-emerald-500/15">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Compression Results
            </span>
            <div className="mt-2 flex items-center justify-center gap-4 text-sm font-semibold">
              <span className="text-slate-500 line-through">{formatBytes(originalSize)}</span>
              <ArrowRight className="h-4 w-4 text-emerald-600" />
              <span className="text-lg text-emerald-600 dark:text-emerald-400 font-bold">{formatBytes(result.fileSize)}</span>
            </div>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Saved {savingsPercent}% of total file size!
            </p>
          </div>

          <ResultScreen
            blob={result.blob}
            filename={result.filename}
            itemCount={result.itemCount}
            itemCountLabel="Pages"
            onReset={() => {
              setResult(null);
              setFile(null);
              setBuffer(null);
              setProgress(0);
            }}
            onNavigateToTool={onNavigateToTool}
            nextSuggestedTool={{
              id: 'sign',
              label: 'Sign your compressed PDF document',
            }}
          />
        </div>
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
        <div className="mx-auto max-w-xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</span>
              <span className="font-mono text-slate-500">{formatBytes(file.size)}</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Compression Level
              </label>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setLevel('extreme')}
                  className={`flex items-start gap-3 w-full rounded-xl border p-3.5 text-left transition-all ${
                    level === 'extreme'
                      ? 'border-rose-500 bg-rose-50/60 dark:border-rose-500/60 dark:bg-rose-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Zap className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <div className="text-xs font-bold">Extreme Compression</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Maximum file size reduction. Ideal for heavy scans and email attachments.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('recommended')}
                  className={`flex items-start gap-3 w-full rounded-xl border p-3.5 text-left transition-all ${
                    level === 'recommended'
                      ? 'border-rose-500 bg-rose-50/60 dark:border-rose-500/60 dark:bg-rose-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Recommended Compression</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded font-medium">Best Balance</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Good quality with substantial file reduction. Cleans unused object streams.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('low')}
                  className={`flex items-start gap-3 w-full rounded-xl border p-3.5 text-left transition-all ${
                    level === 'low'
                      ? 'border-rose-500 bg-rose-50/60 dark:border-rose-500/60 dark:bg-rose-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Minimize2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <div className="text-xs font-bold">Less Compression</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      High quality preservation with gentle compression.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {isProcessing && (
              <ProgressBar progress={progress} statusMessage={progressMessage} />
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompress}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              <span>Compress PDF</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
