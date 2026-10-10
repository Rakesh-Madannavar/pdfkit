import React from 'react';
import { FileText, ShieldCheck, Heart } from 'lucide-react';
import { ToolId } from '../types/pdf';

interface FooterProps {
  onNavigate: (tool: ToolId | 'home') => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPrivacy,
  onOpenTerms,
  onOpenContact,
}) => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 mt-auto transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-sm">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                PDF<span className="text-rose-600 dark:text-rose-500">Kit</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fast, completely free, and 100% private in-browser PDF utilities. We never upload, inspect, or store your documents.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-server data policy</span>
            </div>
          </div>

          {/* Tools Category 1: Organize & Split */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Organize & Edit
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('merge')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Merge PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('split')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Split PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('rotate')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Rotate PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('organize')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Organize Pages
                </button>
              </li>
            </ul>
          </div>

          {/* Tools Category 2: Convert & Stamp */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Convert & Stamp
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('pdf-to-jpg')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  PDF to JPG
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('jpg-to-pdf')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  JPG to PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page-numbers')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Add Page Numbers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('watermark')} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Add Watermark
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Trust
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Privacy Policy & Guarantee
                </button>
              </li>
              <li>
                <button onClick={onOpenTerms} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={onOpenContact} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Contact & Feedback
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} PDFKit. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for high performance & privacy</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
