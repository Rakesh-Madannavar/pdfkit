import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, ServerOff, Cpu } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="privacy-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                100% Client-Side Privacy Guarantee
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How PDFKit protects your documents and data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <ServerOff className="w-4 h-4 text-rose-500" />
                <span>Zero Server Uploads</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlike cloud converters, PDFKit processes everything directly in your browser. Files never touch any remote server.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span>Local CPU Power</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF manipulation is performed using WebAssembly and pure client-side JavaScript (pdf-lib & pdf.js).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Data Volatility</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Files exist strictly in your browser&apos;s volatile RAM memory. Once you refresh or close the tab, all memory is instantly cleared.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <EyeOff className="w-4 h-4 text-purple-500" />
                <span>Confidential & Safe</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perfect for sensitive legal documents, medical forms, tax files, and financial statements. No logs, no telemetry on file data.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            <strong>Verification Tip:</strong> You can disconnect your Wi-Fi or turn on Airplane Mode after opening PDFKit — every single tool will continue to work seamlessly offline!
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-lg transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
