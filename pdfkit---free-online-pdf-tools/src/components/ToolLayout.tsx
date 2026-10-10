import React from 'react';
import { ArrowLeft, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { ToolMeta } from '../types/pdf';

interface ToolLayoutProps {
  tool: ToolMeta;
  onBack: () => void;
  error?: string | null;
  onClearError?: () => void;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  onBack,
  error,
  onClearError,
  children,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation bar & Title */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>All Tools</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Runs locally on your device</span>
          </div>
        </div>

        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tool.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div 
          className="mb-6 flex items-start justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Operation Failed</p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 dark:text-rose-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Main tool container */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};
