import React, { useState, useEffect } from 'react';
import { FileText, Copy, Download, Check, Code, FileSpreadsheet } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { extractTextFromPdf, PdfTextExtractionResult } from '../utils/pdfTextExtract';
import { triggerDownload } from '../utils/download';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId } from '../types/pdf';

interface PdfToTextPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const PdfToTextPage: React.FC<PdfToTextPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('pdf-to-text')!;
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [extractedData, setExtractedData] = useState<PdfTextExtractionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Extracting readable text...');

    try {
      const buffer = await selected.arrayBuffer();
      const result = await extractTextFromPdf(buffer, (p, msg) => {
        setProgress(p);
        setProgressMessage(msg);
      });
      setExtractedData(result);
    } catch (err: any) {
      console.error('Text extract error:', err);
      setError(err.message || 'Failed to extract text from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(extractedData.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedData || !file) return;
    const blob = new Blob([extractedData.fullText], { type: 'text/plain;charset=utf-8' });
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(blob, `${cleanName}_extracted.txt`);
  };

  const handleDownloadHtml = () => {
    if (!extractedData || !file) return;
    const blob = new Blob([extractedData.htmlContent], { type: 'text/html;charset=utf-8' });
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(blob, `${cleanName}_extracted.html`);
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Article.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'PDF to Text - Extract Text from PDF Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {!file ? (
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
      ) : isProcessing ? (
        <div className="mx-auto max-w-xl">
          <ProgressBar progress={progress} statusMessage={progressMessage} />
        </div>
      ) : extractedData ? (
        <div className="space-y-6">
          {/* Header Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</h3>
              <p className="text-xs text-slate-500 font-mono">
                {extractedData.pageCount} pages · {extractedData.totalWords.toLocaleString()} words · {extractedData.totalCharacters.toLocaleString()} characters
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy All Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 transition-all"
              >
                <Code className="h-3.5 w-3.5" />
                <span>Download .HTML</span>
              </button>
            </div>
          </div>

          {/* Text Content Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Extracted Content
            </h4>
            <textarea
              readOnly
              value={extractedData.fullText}
              rows={16}
              className="w-full rounded-xl border border-slate-100 bg-slate-50/70 p-4 font-mono text-xs text-slate-800 leading-relaxed dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 focus:outline-none resize-y"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setExtractedData(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Extract text from another PDF
            </button>
          </div>
        </div>
      ) : null}
    </ToolLayout>
  );
};
