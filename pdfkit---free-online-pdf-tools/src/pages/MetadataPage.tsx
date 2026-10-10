import React, { useState, useEffect } from 'react';
import { FileSignature, ArrowRight, Save, Info } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { readPdfMetadata, updatePdfMetadata, PdfMetadataInfo } from '../utils/pdfMetadata';
import { generateSamplePdf } from '../utils/samplePdf';
import { ToolId, ProcessResult } from '../types/pdf';

interface MetadataPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const MetadataPage: React.FC<MetadataPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('metadata')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [producer, setProducer] = useState('');
  const [creator, setCreator] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
      const meta = await readPdfMetadata(buf);
      setTitle(meta.title || selected.name.replace(/\.[^/.]+$/, ''));
      setAuthor(meta.author || '');
      setSubject(meta.subject || '');
      setKeywords(meta.keywords?.join(', ') || '');
      setProducer(meta.producer || 'PDFKit');
      setCreator(meta.creator || 'PDFKit');
    } catch {
      setError('Could not load PDF metadata.');
    }
  };

  const handleSaveMetadata = async () => {
    if (!buffer || !file) return;

    setIsProcessing(true);
    setProgress(30);
    setError(null);

    try {
      const { blob, pageCount } = await updatePdfMetadata(buffer, {
        title,
        author,
        subject,
        keywords,
        producer,
        creator,
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_updated_meta.pdf`,
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Metadata error:', err);
      setError(err.message || 'Failed to update PDF metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Whitepaper.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Edit PDF Metadata - Change Title & Author Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'compress',
            label: 'Compress your PDF with updated metadata',
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
        <div className="mx-auto max-w-xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Edit Document Metadata
                </h3>
                <p className="text-xs text-slate-500">{file.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Financial Report 2026"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Author / Organization
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Jane Doe, Acme Corp"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Quarterly earnings and strategic roadmap"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="finance, audit, 2026, compliance"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {isProcessing && (
              <ProgressBar progress={progress} statusMessage="Writing updated metadata dictionary..." />
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveMetadata}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              <span>Save & Download PDF</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
