import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  statusMessage?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, statusMessage }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin text-rose-600 dark:text-rose-400" />
          <span>{statusMessage || 'Processing in browser...'}</span>
        </div>
        <span className="font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">
          {clamped}%
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <p className="text-right text-[11px] text-slate-400 dark:text-slate-500">
        Processed locally with client-side WebAssembly
      </p>
    </div>
  );
};
