import React, { useState } from 'react';
import { 
  Layers, 
  Scissors, 
  RotateCw, 
  Grid3X3, 
  Image, 
  FileImage, 
  Hash, 
  Stamp, 
  ShieldCheck, 
  Zap, 
  Lock, 
  ArrowRight,
  Search,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Minimize2,
  Crop,
  PenTool,
  FileText,
  Table,
  Presentation,
  Compass,
  FileArchive,
  Layers2,
  FileSpreadsheet
} from 'lucide-react';
import { TOOLS_CONFIG, CATEGORIES } from '../utils/toolsConfig';
import { ToolId, ToolCategory } from '../types/pdf';

interface HomePageProps {
  onSelectTool: (tool: ToolId) => void;
  onOpenPrivacy: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectTool, onOpenPrivacy }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<ToolCategory | 'all'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getToolIcon = (iconName: string) => {
    const props = { className: "h-6 w-6 stroke-[1.8]" };
    switch (iconName) {
      case 'Layers': return <Layers {...props} />;
      case 'Scissors': return <Scissors {...props} />;
      case 'RotateCw': return <RotateCw {...props} />;
      case 'Grid3X3': return <Grid3X3 {...props} />;
      case 'Image': return <Image {...props} />;
      case 'FileImage': return <FileImage {...props} />;
      case 'Hash': return <Hash {...props} />;
      case 'Stamp': return <Stamp {...props} />;
      case 'Minimize2': return <Minimize2 {...props} />;
      case 'Crop': return <Crop {...props} />;
      case 'PenTool': return <PenTool {...props} />;
      case 'FileText': return <FileText {...props} />;
      case 'Table': return <Table {...props} />;
      case 'Presentation': return <Presentation {...props} />;
      case 'FileArchive': return <FileArchive {...props} />;
      case 'Layers2': return <Layers2 {...props} />;
      case 'FileSpreadsheet': return <FileSpreadsheet {...props} />;
      case 'Compass': return <Compass {...props} />;
      default: return <Layers {...props} />;
    }
  };

  const filteredTools = TOOLS_CONFIG.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || t.category === selectedCat;
    return matchesSearch && matchesCat && t.id !== 'hub';
  });

  const faqs = [
    {
      q: 'Are my files really safe and private?',
      a: 'Yes, 100%. PDFKit runs entirely inside your browser using client-side WebAssembly and modern JavaScript. Your files are never uploaded to any cloud server or third-party database. When you close the browser tab, the memory is cleared instantly.',
    },
    {
      q: 'Is there any file size limit or cost?',
      a: 'PDFKit is completely free with no subscriptions, ads, or hidden paywalls. We support files up to 100 MB per document, which is more than enough for books, research reports, and scanned archives.',
    },
    {
      q: 'Can I process Word, Excel, and PowerPoint files without a server?',
      a: 'Yes! PDFKit inspects and transforms Office documents directly in your browser. DOCX and PPTX are OpenXML packages parsed locally with mammoth and JSZip, and spreadsheets are handled with SheetJS.',
    },
    {
      q: 'Does PDFKit add any unwanted watermarks to my documents?',
      a: 'Never. Your processed documents remain clean and untampered with. The only watermark added is if you explicitly choose to use the "Add Watermark" tool.',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-12 text-center">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-rose-500/10 dark:bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          {/* Privacy badge */}
          <button
            onClick={onOpenPrivacy}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>100% Client-Side · Files Never Leave Your Device</span>
          </button>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Every tool you need to work with PDFs in <span className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">one place</span>.
          </h1>

          {/* Subtext */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            Fast, secure, and completely free in-browser PDF utilities. Merge, split, compress, sign, organize, convert, watermark, and number your documents with absolute privacy.
          </p>

          {/* Search bar & Quick Tool Finder */}
          <div className="mx-auto max-w-md pt-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a tool (e.g. merge, compress, sign, excel, crop)..."
                className="w-full rounded-2xl border border-slate-200/90 bg-white/80 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              PDF Toolkit & Converters
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select any tool below to begin processing your files immediately.
            </p>
          </div>

          <button
            onClick={() => onSelectTool('hub')}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <Compass className="w-4 h-4" />
            <span>Open All Converters Hub ({TOOLS_CONFIG.length - 1} tools) →</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedCat === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCat === cat.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredTools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tools matching &ldquo;{searchQuery}&rdquo;. Try another keyword.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCat('all');
              }}
              className="mt-3 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredTools.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                className="group relative flex flex-col items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-sm hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/10 dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-rose-500/50 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="space-y-4 w-full">
                  {/* Icon container */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${t.bgColor}`}>
                      {getToolIcon(t.icon)}
                    </div>
                    {t.badge ? (
                      <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                        {t.badge}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-rose-500 transition-colors flex items-center gap-1">
                        <span>Launch</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {t.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 w-full flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{t.category.replace('-', ' ')}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Free</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* "How It Works" 3-step section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-8 sm:p-12 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How PDFKit Works
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Three effortless steps to transform your documents without installing software
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative flex flex-col items-center text-center space-y-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white font-bold text-lg shadow-md shadow-rose-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Choose Your Files
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag and drop your PDF or office documents into the workspace. Upload up to 100 MB with instant local read.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center space-y-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-lg shadow-md shadow-orange-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Customize with Real-Time Preview
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Sign, compress, crop, or extract data visually using responsive thumbnails and live controls.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center space-y-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-md shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Download Instantly
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Download your merged, compressed, or transformed file in one click. No waiting for server queues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "Why PDFKit" Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Professionals Choose PDFKit
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Engineered from scratch to solve the biggest privacy and speed issues of traditional PDF sites
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3 shadow-sm">
            <div className="p-3 w-fit rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              100% Private & Secure
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Files never upload to any server. Your sensitive legal, tax, or medical paperwork stays confidential on your machine.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3 shadow-sm">
            <div className="p-3 w-fit rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Blazing Fast Speed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No slow upload queues or network latency. All modifications take advantage of your device&apos;s multi-core CPU.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3 shadow-sm">
            <div className="p-3 w-fit rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Accounts or Signups
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No credit cards, no sign-up gates, and no email spam. Jump straight in, get your work done, and leave with your file.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3 shadow-sm">
            <div className="p-3 w-fit rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Watermarks Added
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We never slap branding or &quot;converted by&quot; notices onto your files. Your documents remain clean and executive-ready.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-8 space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed animate-in fade-in duration-200 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
