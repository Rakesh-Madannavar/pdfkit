import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="terms-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Terms of Service
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDFKit Free Online PDF Toolkit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free for Personal & Commercial Use
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PDFKit is provided 100% free of charge for both individual and business purposes with no hidden fees, subscriptions, or watermarks attached to unmodified documents.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Client-Side Processing License
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All computations occur locally on the user&apos;s machine. You retain all ownership, copyrights, and intellectual property rights to your files and documents.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> As-Is Disclaimer
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The service is provided &quot;as is&quot; without warranties of any kind. While PDFKit uses robust, standard PDF processing libraries (pdf-lib and pdf.js), users should keep backups of original documents.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
