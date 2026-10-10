import React, { useState, useEffect } from 'react';
import { 
  FileImage, 
  Trash2, 
  Plus, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  Settings2
} from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { 
  convertImagesToPdf, 
  PageSizeOption, 
  MarginOption, 
  OrientationOption, 
  ImageInputItem 
} from '../utils/imageToPdf';
import { formatBytes } from '../utils/download';
import { ToolId, ProcessResult } from '../types/pdf';

interface ImageUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
}

interface JpgToPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const JpgToPdfPage: React.FC<JpgToPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('jpg-to-pdf')!;
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [margin, setMargin] = useState<MarginOption>('none');
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleImagesSelected = (newRawFiles: File[]) => {
    setError(null);
    const addedItems: ImageUploadItem[] = newRawFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...addedItems]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const updated = [...images];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(targetIndex);
    setImages(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setProgressMessage('Reading image data...');
    setError(null);

    try {
      const preparedImages: ImageInputItem[] = [];
      for (const item of images) {
        const buffer = await item.file.arrayBuffer();
        preparedImages.push({
          name: item.name,
          buffer,
          type: item.file.type || 'image/jpeg',
        });
      }

      const { blob, pageCount } = await convertImagesToPdf(preparedImages, {
        pageSize,
        margin,
        orientation,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
      });

      setResult({
        blob,
        filename: 'images_converted.pdf',
        fileSize: blob.size,
        itemCount: pageCount,
      });
    } catch (err: any) {
      console.error('Image to PDF error:', err);
      setError(err.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to create sample photos via offscreen canvas
  const handleLoadSampleImages = () => {
    const sampleFiles: File[] = [];
    const colors = ['#f43f5e', '#3b82f6', '#10b981'];
    const titles = ['Document Photo 1', 'Document Photo 2', 'Document Photo 3'];

    colors.forEach((color, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 800, 1000);
        ctx.fillStyle = color;
        ctx.fillRect(40, 40, 720, 200);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(titles[i], 70, 150);

        ctx.fillStyle = '#334155';
        ctx.font = '22px sans-serif';
        ctx.fillText('Sample Camera Capture / Scanned Image', 70, 320);
        ctx.fillText('Converted seamlessly to PDF on-device', 70, 360);

        canvas.toBlob((blob) => {
          if (blob) {
            const f = new File([blob], `sample_photo_${i + 1}.jpg`, { type: 'image/jpeg' });
            sampleFiles.push(f);
            if (sampleFiles.length === colors.length) {
              handleImagesSelected(sampleFiles);
            }
          }
        }, 'image/jpeg', 0.9);
      }
    });
  };

  useEffect(() => {
    document.title = 'JPG to PDF - Convert Images to PDF Online | PDFKit';
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
            setImages([]);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'page-numbers',
            label: 'Add page numbers to this new PDF',
          }}
        />
      ) : images.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <FileDropzone
            accept={tool.accepts}
            acceptLabel={tool.acceptLabel}
            multiple={true}
            onFilesSelected={handleImagesSelected}
            sampleAction={{
              label: 'Try with 3 Sample Images',
              action: handleLoadSampleImages,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Middle: Images Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                {images.length} {images.length === 1 ? 'image' : 'images'} loaded
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                <Plus className="h-3.5 w-3.5" />
                <span>Add More Images</span>
                <input
                  type="file"
                  accept={tool.accepts}
                  multiple
                  disabled={isProcessing}
                  onChange={(e) => {
                    if (e.target.files) handleImagesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto p-1">
              {images.map((img, idx) => {
                const isDragging = draggedIndex === idx;

                return (
                  <div
                    key={img.id}
                    draggable={!isProcessing}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex flex-col rounded-xl border bg-white p-2.5 shadow-sm transition-all dark:bg-slate-900 ${
                      isDragging
                        ? 'opacity-40 border-rose-500 scale-95 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1 cursor-grab font-mono text-[11px]">
                        <GripVertical className="h-3 w-3 text-slate-400" />
                        <span>#{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, -1)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => moveImage(idx, 1)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-[1/1.25] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img
                        src={img.previewUrl}
                        alt={img.name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300" title={img.name}>
                        {img.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Layout & Options Settings */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Settings2 className="h-4 w-4 text-orange-600" />
                <span>PDF Page Setup</span>
              </div>

              {/* Page Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageSize('fit')}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      pageSize === 'fit'
                        ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Fit Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSize('a4')}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      pageSize === 'a4'
                        ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSize('letter')}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      pageSize === 'letter'
                        ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    US Letter
                  </button>
                </div>
              </div>

              {/* Orientation (only if not fit) */}
              {pageSize !== 'fit' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Orientation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientation('auto')}
                      className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                        orientation === 'auto'
                          ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                        orientation === 'portrait'
                          ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                        orientation === 'landscape'
                          ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
              )}

              {/* Margins */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Margin
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMargin('none')}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      margin === 'none'
                        ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    No Margin
                  </button>
                  <button
                    type="button"
                    onClick={() => setMargin('small')}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      margin === 'small'
                        ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Small
                  </button>
                  <button
                    type="button"
                    onClick={() => setMargin('large')}
                    className={`rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                      margin === 'large'
                        ? 'border-orange-500 bg-orange-50/60 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              {/* Action */}
              <button
                type="button"
                disabled={isProcessing || images.length === 0}
                onClick={handleConvert}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Convert to PDF</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
