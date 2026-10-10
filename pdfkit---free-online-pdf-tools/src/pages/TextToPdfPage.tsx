import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, Settings2 } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { convertTextToPdf } from '../utils/textToPdf';
import { ToolId, ProcessResult } from '../types/pdf';

interface TextToPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const TextToPdfPage: React.FC<TextToPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('text-to-pdf')!;
  const [text, setText] = useState<string>(
    `Project Proposal & Executive Overview\n\n1. Introduction\nThis document provides an overview of the technical specifications, scope of work, and release milestones for the forthcoming initiative.\n\n2. Key Objectives\n- Seamless client-side execution with zero external data transmissions\n- Exceptional typographic contrast and responsive design\n- Automated page numbering and header layouts\n\n3. Conclusion\nAll deliverables will undergo rigorous verification before deployment.`
  );
  const [docTitle, setDocTitle] = useState('Project Proposal');
  const [fontSize, setFontSize] = useState(11);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    const raw = await file.text();
    setText(raw);
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleGeneratePdf = async () => {
    if (!text.trim()) {
      setError('Please provide text to convert.');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    setProgressMessage('Laying out text typography into pages...');
    setError(null);

    try {
      const { blob, pageCount } = await convertTextToPdf(text, {
        fontSize,
        title: docTitle,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
      });

      setResult({
        blob,
        filename: `${docTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Text to PDF error:', err);
      setError(err.message || 'Failed to generate PDF from text.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    document.title = 'Text to PDF - Convert Text to PDF Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages generated"
          onReset={() => {
            setResult(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'page-numbers',
            label: 'Add custom page number formatting',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Text Editor Area */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Enter or paste your text</span>
              <label className="cursor-pointer font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                Upload .TXT File
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => {
                    if (e.target.files) handleFileSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={16}
              placeholder="Paste or write your document content here..."
              className="w-full rounded-2xl border border-slate-200 bg-white p-5 font-sans text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-rose-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white leading-relaxed resize-y"
            />
          </div>

          {/* Right Layout Options */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Settings2 className="h-4 w-4 text-blue-600" />
                <span>Document Layout</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Header Document Title
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Font Size</span>
                  <span className="font-mono text-[11px] text-slate-500">{fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min={9}
                  max={16}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              <button
                type="button"
                disabled={isProcessing || !text.trim()}
                onClick={handleGeneratePdf}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Generate PDF</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
