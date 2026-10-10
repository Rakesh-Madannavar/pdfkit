import React, { useState } from 'react';
import { 
  FileText, 
  Moon, 
  Sun, 
  ShieldCheck, 
  ChevronDown, 
  Layers, 
  Scissors, 
  RotateCw, 
  Grid3X3, 
  Image, 
  FileImage, 
  Hash, 
  Stamp,
  Minimize2,
  Crop,
  PenTool,
  Table,
  Presentation,
  Compass,
  FileArchive,
  Menu,
  X
} from 'lucide-react';
import { TOOLS_CONFIG, CATEGORIES } from '../utils/toolsConfig';
import { ToolId } from '../types/pdf';

interface NavbarProps {
  currentTool: ToolId | 'home';
  onNavigate: (tool: ToolId | 'home') => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenPrivacy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTool,
  onNavigate,
  isDark,
  onToggleDark,
  onOpenPrivacy,
}) => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'Scissors': return <Scissors className="w-4 h-4" />;
      case 'RotateCw': return <RotateCw className="w-4 h-4" />;
      case 'Grid3X3': return <Grid3X3 className="w-4 h-4" />;
      case 'Image': return <Image className="w-4 h-4" />;
      case 'FileImage': return <FileImage className="w-4 h-4" />;
      case 'Hash': return <Hash className="w-4 h-4" />;
      case 'Stamp': return <Stamp className="w-4 h-4" />;
      case 'Minimize2': return <Minimize2 className="w-4 h-4" />;
      case 'Crop': return <Crop className="w-4 h-4" />;
      case 'PenTool': return <PenTool className="w-4 h-4" />;
      case 'Table': return <Table className="w-4 h-4" />;
      case 'Presentation': return <Presentation className="w-4 h-4" />;
      case 'FileArchive': return <FileArchive className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              onNavigate('home');
              setToolsOpen(false);
              setMobileMenuOpen(false);
            }}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
            aria-label="PDFKit Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                PDF<span className="text-rose-600 dark:text-rose-500">Kit</span>
              </span>
            </div>
          </button>

          {/* Desktop Tools Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              onBlur={() => setTimeout(() => setToolsOpen(false), 250)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              aria-expanded={toolsOpen}
              aria-haspopup="true"
            >
              <span>All Tools</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsOpen && (
              <div 
                className="absolute left-0 mt-2 w-96 max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Toolkit Directory</span>
                  <button
                    onClick={() => {
                      onNavigate('hub');
                      setToolsOpen(false);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                  >
                    View All Hub →
                  </button>
                </div>

                <div className="space-y-3">
                  {CATEGORIES.map((cat) => {
                    const catTools = TOOLS_CONFIG.filter((t) => t.category === cat.id && t.id !== 'hub');
                    if (catTools.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1">
                          {cat.label}
                        </div>
                        {catTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              onNavigate(t.id);
                              setToolsOpen(false);
                            }}
                            className={`flex items-center gap-2.5 w-full rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                              currentTool === t.id
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <div className={`p-1 rounded-md ${t.bgColor}`}>
                              {getToolIcon(t.icon)}
                            </div>
                            <span className="truncate">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Top Tools on Desktop */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
          <button
            onClick={() => onNavigate('merge')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTool === 'merge' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Merge
          </button>
          <button
            onClick={() => onNavigate('split')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTool === 'split' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => onNavigate('compress')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTool === 'compress' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Compress
          </button>
          <button
            onClick={() => onNavigate('sign')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTool === 'sign' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Sign
          </button>
          <button
            onClick={() => onNavigate('pdf-to-jpg')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTool === 'pdf-to-jpg' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            PDF to JPG
          </button>
          <button
            onClick={() => onNavigate('hub')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              currentTool === 'hub' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Converter Hub</span>
          </button>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Privacy badge button */}
          <button
            onClick={onOpenPrivacy}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            title="All PDF processing happens 100% locally in your browser"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Client-Side</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden max-h-[80vh] overflow-y-auto border-b border-slate-200 bg-white px-4 pt-2 pb-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">PDF Tools Hub</span>
            <button
              onClick={() => {
                onNavigate('hub');
                setMobileMenuOpen(false);
              }}
              className="text-xs text-rose-600 font-semibold"
            >
              Browse All →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS_CONFIG.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onNavigate(t.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                  currentTool === t.id
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-1 rounded ${t.bgColor}`}>
                  {getToolIcon(t.icon)}
                </div>
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
