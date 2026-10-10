import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Plus, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { formatBytes } from '../utils/download';
import { mergePdfFiles } from '../utils/pdfMerge';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { UploadedFile, ToolId, ProcessResult } from '../types/pdf';

interface MergePdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const MergePdfPage: React.FC<MergePdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('merge')!;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // When new files are added, read arrayBuffer and generate thumbnail for each
  const handleFilesAdded = async (newRawFiles: File[]) => {
    setError(null);
    const addedItems: UploadedFile[] = newRawFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
    }));

    setFiles((prev) => [...prev, ...addedItems]);

    // Asynchronously load thumbnail & page count for newly added files
    for (const item of addedItems) {
      try {
        const buffer = await item.file.arrayBuffer();
        const pdfDoc = await loadPdfDocument(buffer);
        const pageCount = pdfDoc.numPages;
        const { dataUrl } = await renderPageToDataUrl(pdfDoc, 1, 200);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, arrayBuffer: buffer, pageCount, thumbnailUrl: dataUrl }
              : f
          )
        );
      } catch (err: any) {
        console.error('Thumbnail generation error for', item.name, err);
        // Fallback: still keep buffer
        try {
          const buffer = await item.file.arrayBuffer();
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, arrayBuffer: buffer } : f))
          );
        } catch {
          // ignore
        }
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const updated = [...files];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(targetIndex);
    setFiles(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setProgressMessage('Reading files into memory...');
    setError(null);

    try {
      // Ensure all buffers are loaded
      const preparedList: Array<{ name: string; buffer: ArrayBuffer }> = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        let buf = f.arrayBuffer;
        if (!buf) {
          buf = await f.file.arrayBuffer();
        }
        preparedList.push({ name: f.name, buffer: buf });
      }

      const { blob, pageCount } = await mergePdfFiles(preparedList, {
        onProgress: (current, total, msg) => {
          const percent = Math.round((current / total) * 85);
          setProgress(percent);
          setProgressMessage(msg);
        },
      });

      setProgress(100);
      setProgressMessage('Merge completed successfully!');

      setResult({
        blob,
        filename: 'merged_document.pdf',
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Merge failure:', err);
      setError(err.message || 'An unexpected error occurred while merging your PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample1 = await generateSamplePdf('Sample_Contract_A.pdf');
    const sample2 = await generateSamplePdf('Sample_Appendix_B.pdf');
    handleFilesAdded([sample1, sample2]);
  };

  // SEO Document Title
  useEffect(() => {
    document.title = 'Merge PDF - Combine PDF Files Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages total"
          onReset={() => {
            setResult(null);
            setFiles([]);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'page-numbers',
            label: 'Add page numbers to your newly merged document',
          }}
        />
      ) : files.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <FileDropzone
            accept={tool.accepts}
            acceptLabel={tool.acceptLabel}
            multiple={true}
            onFilesSelected={handleFilesAdded}
            sampleAction={{
              label: 'Try with 2 Sample PDFs',
              action: handleLoadSample,
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {files.length} {files.length === 1 ? 'file' : 'files'} selected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drag files to adjust merge order, or use arrow buttons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Add more files picker */}
              <label className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span>Add More Files</span>
                <input
                  type="file"
                  accept={tool.accepts}
                  multiple
                  disabled={isProcessing}
                  onChange={(e) => {
                    if (e.target.files) handleFilesAdded(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>

              {/* Merge button */}
              <button
                type="button"
                disabled={isProcessing || files.length < 2}
                onClick={handleMerge}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-95"
              >
                <span>Merge PDF</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar if working */}
          {isProcessing && (
            <ProgressBar progress={progress} statusMessage={progressMessage} />
          )}

          {/* Files List / Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fileItem, idx) => {
              const isDragging = draggedIndex === idx;

              return (
                <div
                  key={fileItem.id}
                  draggable={!isProcessing}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex flex-col rounded-2xl border bg-white p-3.5 shadow-sm transition-all dark:bg-slate-900 ${
                    isDragging
                      ? 'opacity-40 border-rose-500 scale-95 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Order Tag & Move Controls */}
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing font-mono">
                      <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0 || isProcessing}
                        onClick={() => moveFile(idx, -1)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 dark:hover:text-white"
                        title="Move up in order"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === files.length - 1 || isProcessing}
                        onClick={() => moveFile(idx, 1)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 dark:hover:text-white"
                        title="Move down in order"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-[1/1.25] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60 mb-3">
                    {fileItem.thumbnailUrl ? (
                      <img
                        src={fileItem.thumbnailUrl}
                        alt={`Preview for ${fileItem.name}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <FileText className="h-10 w-10 stroke-[1.5]" />
                        <span className="text-[11px]">PDF Document</span>
                      </div>
                    )}

                    {fileItem.pageCount !== undefined && (
                      <div className="absolute bottom-2 right-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-sm">
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'page' : 'pages'}
                      </div>
                    )}
                  </div>

                  {/* File name & size */}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white" title={fileItem.name}>
                        {fileItem.name}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {formatBytes(fileItem.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => removeFile(fileItem.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
