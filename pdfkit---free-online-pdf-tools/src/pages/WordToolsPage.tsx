import React, { useState, useEffect } from 'react';
import { FileText, Copy, Download, Check, BarChart2, BookOpen, Clock } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { convertDocx } from '../utils/officeTools';
import { triggerDownload } from '../utils/download';
import { ToolId } from '../types/pdf';

interface WordToolsPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const WordToolsPage: React.FC<WordToolsPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('word-to-text')!;
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live input for text counting if user writes manually
  const [customInput, setCustomInput] = useState('');

  const activeText = rawText || customInput;
  const activeWords = activeText.trim().split(/\s+/).filter(Boolean).length;
  const activeChars = activeText.length;
  const readingTimeMin = Math.ceil(activeWords / 200);
  const speakingTimeMin = Math.ceil(activeWords / 130);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    setIsProcessing(true);

    try {
      const res = await convertDocx(selected);
      setRawText(res.text);
      setHtmlContent(res.html);
      setWordCount(res.wordCount);
      setCharCount(res.text.length);
    } catch (err: any) {
      console.error('Docx error:', err);
      setError('Could not read Word DOCX document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([activeText], { type: 'text/plain;charset=utf-8' });
    const name = file ? file.name.replace(/\.[^/.]+$/, '') : 'document';
    triggerDownload(blob, `${name}_text.txt`);
  };

  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Word Export</title></head><body>${htmlContent || `<p>${activeText.replace(/\n/g, '<br/>')}</p>`}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const name = file ? file.name.replace(/\.[^/.]+$/, '') : 'document';
    triggerDownload(blob, `${name}_converted.html`);
  };

  useEffect(() => {
    document.title = 'Word to Text / HTML & Word Counter | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      <div className="space-y-6">
        {/* Real-time word counter metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Words</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {activeWords.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Characters</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {activeChars.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading Time</span>
            </div>
            <div className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              ~{readingTimeMin} min
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Speech Time</span>
            </div>
            <div className="mt-1 text-2xl font-extrabold text-orange-600 dark:text-orange-400 font-mono">
              ~{speakingTimeMin} min
            </div>
          </div>
        </div>

        {!rawText ? (
          <div className="space-y-6">
            <div className="mx-auto max-w-2xl">
              <FileDropzone
                accept={tool.accepts}
                acceptLabel="Word DOCX files"
                multiple={false}
                onFilesSelected={handleFileSelected}
              />
            </div>

            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Or type / paste text below to count</span>
            </div>

            <div className="mx-auto max-w-2xl">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste or type any text here to count words, characters, and estimate reading time in real-time..."
                rows={8}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file?.name}</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .TXT</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .HTML</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={rawText}
              rows={14}
              className="w-full rounded-2xl border border-slate-200 bg-white p-5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 resize-y"
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
