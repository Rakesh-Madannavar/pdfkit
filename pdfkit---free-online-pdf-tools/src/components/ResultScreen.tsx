import React from 'react';
import { Download, CheckCircle2, RotateCcw, FileArchive, FileText, ArrowRight } from 'lucide-react';
import { formatBytes, triggerDownload } from '../utils/download';
import { ToolId } from '../types/pdf';

interface ResultScreenProps {
  blob: Blob;
  filename: string;
  isZip?: boolean;
  itemCount?: number;
  itemCountLabel?: string;
  onReset: () => void;
  onNavigateToTool?: (tool: ToolId) => void;
  nextSuggestedTool?: {
    id: ToolId;
    label: string;
  };
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  blob,
  filename,
  isZip = false,
  itemCount,
  itemCountLabel = 'Pages',
  onReset,
  onNavigateToTool,
  nextSuggestedTool,
}) => {
  const handleDownload = () => {
    triggerDownload(blob, filename);
  };

  return (
    <div className="mx-auto max-w-xl text-center space-y-8 py-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Success Badge */}
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your document is ready!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Processed 100% locally in your browser with complete privacy.
        </p>
      </div>

      {/* File card info */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            {isZip ? <FileArchive className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-slate-900 dark:text-white text-sm" title={filename}>
              {filename}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formatBytes(blob.size)}</span>
              {itemCount !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{itemCount} {itemCountLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Download Action */}
      <div className="space-y-3">
        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-4 px-6 text-base font-semibold text-white shadow-lg shadow-rose-600/25 hover:from-rose-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 active:scale-[0.99] transition-all"
        >
          <Download className="h-5 w-5" />
          <span>Download {isZip ? 'ZIP Archive' : 'PDF Document'}</span>
        </button>

        <button
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Process another file</span>
        </button>
      </div>

      {/* Suggested next step */}
      {nextSuggestedTool && onNavigateToTool && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Suggested next step
          </div>
          <button
            onClick={() => onNavigateToTool(nextSuggestedTool.id)}
            className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/20 transition-all"
          >
            <span>{nextSuggestedTool.label}</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      )}
    </div>
  );
};
