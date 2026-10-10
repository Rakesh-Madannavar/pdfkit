import React, { useState, useEffect } from 'react';
import { Layers2, ArrowRight, ShieldCheck } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { flattenPdf } from '../utils/pdfFlatten';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId, ProcessResult } from '../types/pdf';

interface FlattenPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const FlattenPdfPage: React.FC<FlattenPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('flatten')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
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
    } catch {
      setError('Could not load PDF document.');
    }
  };

  const handleFlatten = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Flattening form fields and annotations...');
    setError(null);

    try {
      const { blob, pageCount } = await flattenPdf(buffer, (p, msg) => {
        setProgress(p);
        setProgressMessage(msg);
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_flattened.pdf`,
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Flatten error:', err);
      setError(err.message || 'Failed to flatten PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Form.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Flatten PDF - Lock Form Fields & Annotations | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages flattened"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'compress',
            label: 'Compress your flattened document',
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
              label: 'Try with Sample Form',
              action: handleLoadSample,
            }}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                <Layers2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Lock & Flatten Form Fields
                </h3>
                <p className="text-xs text-slate-500">
                  {file.name}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>What happens when you flatten?</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                All interactive text fields, checkboxes, drop-downs, digital signatures, and comments will be permanently merged into the page graphics so nobody can tamper with or edit the filled values.
              </p>
            </div>

            {isProcessing && (
              <ProgressBar progress={progress} statusMessage={progressMessage} />
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleFlatten}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              <span>Flatten PDF</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
