import React, { useState, useEffect } from 'react';
import { Maximize2, Download, ArrowRight, Settings2, Image as ImageIcon } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { processImage } from '../utils/imageTools';
import { formatBytes, triggerDownload } from '../utils/download';
import { ToolId } from '../types/pdf';

interface ImageToolsPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const ImageToolsPage: React.FC<ImageToolsPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('image-tools')!;
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState(0.85);
  const [maxWidth, setMaxWidth] = useState(1920);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; dataUrl: string; width: number; height: number; originalSize: number; newSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await processImage(file, {
        maxWidth,
        format,
        quality,
      });
      setResult(res);
    } catch (err: any) {
      console.error('Image processing error:', err);
      setError(err.message || 'Failed to process image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
    triggerDownload(result.blob, `${cleanName}_optimized.${ext}`);
  };

  useEffect(() => {
    document.title = 'Image Compressor & Resizer - Convert JPG PNG WebP | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {!file ? (
        <div className="mx-auto max-w-2xl">
          <FileDropzone
            accept="image/jpeg,image/png,image/webp"
            acceptLabel="JPG, PNG, or WebP image"
            multiple={false}
            onFilesSelected={handleFileSelected}
            helperText="Resize image dimensions, compress weight, and convert between JPG, PNG, and WebP"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</span>
              <span className="font-mono text-slate-500">{formatBytes(file.size)}</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-6 dark:border-slate-800 dark:bg-slate-900/40 flex items-center justify-center min-h-[380px]">
              <div className="max-h-[360px] overflow-hidden rounded-xl shadow-lg">
                <img
                  src={result ? result.dataUrl : previewUrl || ''}
                  alt="Image preview"
                  className="max-h-[360px] w-auto object-contain"
                />
              </div>
            </div>

            {result && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center dark:bg-emerald-500/15">
                <div className="flex items-center justify-center gap-4 text-sm font-semibold">
                  <span className="text-slate-500 line-through">{formatBytes(result.originalSize)}</span>
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatBytes(result.newSize)}</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Resolution: {result.width} × {result.height} px
                </p>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Settings2 className="h-4 w-4 text-pink-600" />
                <span>Image Settings</span>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('image/webp')}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                      format === 'image/webp' ? 'border-pink-500 bg-pink-50/60 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    WebP (Best)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('image/jpeg')}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                      format === 'image/jpeg' ? 'border-pink-500 bg-pink-50/60 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('image/png')}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                      format === 'image/png' ? 'border-pink-500 bg-pink-50/60 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* Quality slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Compression Quality</span>
                  <span className="font-mono text-[11px] text-slate-500">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-pink-600 cursor-pointer"
                />
              </div>

              {/* Max width */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Maximum Width (px)</label>
                <input
                  type="number"
                  min={200}
                  max={4000}
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value, 10) || 1920)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {isProcessing && (
                <ProgressBar progress={50} statusMessage="Compressing image on canvas..." />
              )}

              {result ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-emerald-500"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Optimized Image</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcess}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  <span>Optimize Image</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
