import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, AlertCircle, FilePlus, ShieldCheck } from 'lucide-react';
import { formatBytes } from '../utils/download';

interface FileDropzoneProps {
  accept: string;
  acceptLabel: string;
  multiple?: boolean;
  maxFileSizeMB?: number; // default 100
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  helperText?: string;
  sampleAction?: {
    label: string;
    action: () => void;
  };
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  acceptLabel,
  multiple = false,
  maxFileSizeMB = 100,
  onFilesSelected,
  disabled = false,
  helperText,
  sampleAction,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

  const handleValidationAndSubmit = useCallback(
    (fileList: FileList | File[]) => {
      setErrorMessage(null);
      const incoming = Array.from(fileList);

      if (incoming.length === 0) return;

      // Filter multiple vs single
      const filesToProcess = multiple ? incoming : [incoming[0]];

      // Check size limits
      for (const file of filesToProcess) {
        if (file.size > maxSizeBytes) {
          setErrorMessage(
            `"${file.name}" exceeds the ${maxFileSizeMB} MB size limit (${formatBytes(file.size)}). Please choose a smaller file.`
          );
          return;
        }

        // Validate basic format
        if (accept.includes('.pdf') && !file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          setErrorMessage(`"${file.name}" is not a valid PDF document.`);
          return;
        }

        if (
          accept.includes('image/') &&
          !file.type.startsWith('image/') &&
          !file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/i)
        ) {
          setErrorMessage(`"${file.name}" is not a recognized JPG or PNG image.`);
          return;
        }
      }

      onFilesSelected(filesToProcess);
    },
    [accept, maxSizeBytes, maxFileSizeMB, multiple, onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleValidationAndSubmit(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleValidationAndSubmit(e.target.files);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      {errorMessage && (
        <div 
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in duration-200"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold uppercase text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 md:p-14 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-rose-500 bg-rose-500/10 scale-[1.01] shadow-lg shadow-rose-500/10'
            : disabled
            ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 cursor-not-allowed opacity-60'
            : 'border-slate-300/80 bg-white hover:border-rose-500/70 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-rose-500/60 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
        />

        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/10 to-orange-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
          <UploadCloud className="h-8 w-8" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {multiple ? 'Choose or drop your files here' : 'Choose or drop your file here'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {helperText || `Supports ${acceptLabel} up to ${maxFileSizeMB} MB per file`}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 active:scale-95 transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>Select {multiple ? 'Files' : 'File'}</span>
          </button>

          {sampleAction && (
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                sampleAction.action();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{sampleAction.label}</span>
            </button>
          )}
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Files stay in your browser. 100% Private & secure.</span>
        </div>
      </div>
    </div>
  );
};
