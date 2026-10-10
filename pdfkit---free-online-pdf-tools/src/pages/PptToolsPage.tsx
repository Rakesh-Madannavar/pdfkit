import React, { useState, useEffect } from 'react';
import { Presentation, Download, Image as ImageIcon, FileText, Check, ArrowRight } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { extractImagesFromPptx, extractTextFromPptx, PptImageItem } from '../utils/officeTools';
import { triggerDownload } from '../utils/download';
import { ToolId } from '../types/pdf';

interface PptToolsPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const PptToolsPage: React.FC<PptToolsPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('ppt-extract-images')!;
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'images' | 'text'>('images');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedImages, setExtractedImages] = useState<PptImageItem[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    setIsProcessing(true);

    try {
      if (mode === 'images') {
        const res = await extractImagesFromPptx(selected);
        setExtractedImages(res.images);
        if (res.zipBlob) setZipBlob(res.zipBlob);
      } else {
        const res = await extractTextFromPptx(selected);
        setExtractedText(res.fullText);
      }
    } catch (err: any) {
      console.error('PPT error:', err);
      setError('Could not parse PowerPoint file. Ensure it is a valid .pptx presentation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!zipBlob || !file) return;
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(zipBlob, `${cleanName}_images.zip`);
  };

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(blob, `${cleanName}_slides_text.txt`);
  };

  useEffect(() => {
    document.title = 'PowerPoint Tools - Extract Images & Text from PPTX | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {!file ? (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setMode('images')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                mode === 'images'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Extract Images from PPT</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                mode === 'text'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Extract Text from PPT</span>
            </button>
          </div>

          <FileDropzone
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            acceptLabel="PowerPoint .pptx file"
            multiple={false}
            onFilesSelected={handleFileSelected}
            helperText="Extract all high-resolution images or slide text directly from PPTX in your browser"
          />
        </div>
      ) : isProcessing ? (
        <div className="mx-auto max-w-xl">
          <ProgressBar progress={50} statusMessage="Unpacking presentation media..." />
        </div>
      ) : mode === 'images' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</h3>
              <p className="text-xs text-slate-500">{extractedImages.length} embedded images found</p>
            </div>
            {zipBlob && (
              <button
                type="button"
                onClick={handleDownloadZip}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
              >
                <Download className="h-4 w-4" />
                <span>Download All as ZIP</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {extractedImages.map((img, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  <img src={img.dataUrl} alt={img.name} className="h-full w-full object-contain" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="truncate max-w-[100px] text-slate-600 dark:text-slate-400">{img.name}</span>
                  <button
                    type="button"
                    onClick={() => triggerDownload(img.blob, img.name)}
                    className="text-orange-600 hover:underline font-semibold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</span>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-500"
            >
              <Download className="h-4 w-4" />
              <span>Download Text (.TXT)</span>
            </button>
          </div>
          <textarea
            readOnly
            value={extractedText}
            rows={16}
            className="w-full rounded-2xl border border-slate-200 bg-white p-5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 resize-y"
          />
        </div>
      )}
    </ToolLayout>
  );
};
