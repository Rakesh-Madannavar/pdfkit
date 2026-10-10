import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
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
  FileText, 
  Table, 
  Presentation, 
  Maximize2, 
  QrCode, 
  FileArchive, 
  FileSignature, 
  Layers2, 
  BarChart2,
  FileSpreadsheet,
  ListFilter
} from 'lucide-react';
import { TOOLS_CONFIG, CATEGORIES } from '../utils/toolsConfig';
import { ToolId, ToolCategory } from '../types/pdf';

interface HubPageProps {
  onSelectTool: (tool: ToolId) => void;
}

export const HubPage: React.FC<HubPageProps> = ({ onSelectTool }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');

  const getToolIcon = (iconName: string) => {
    const props = { className: "h-5 w-5" };
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
      case 'Maximize2': return <Maximize2 {...props} />;
      case 'QrCode': return <QrCode {...props} />;
      case 'FileArchive': return <FileArchive {...props} />;
      case 'FileSignature': return <FileSignature {...props} />;
      case 'Layers2': return <Layers2 {...props} />;
      case 'BarChart2': return <BarChart2 {...props} />;
      case 'FileSpreadsheet': return <FileSpreadsheet {...props} />;
      case 'ListFilter': return <ListFilter {...props} />;
      default: return <Layers {...props} />;
    }
  };

  const filteredTools = TOOLS_CONFIG.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCat && t.id !== 'hub';
  });

  useEffect(() => {
    document.title = 'All PDF Tools & Converters Hub | PDFKit';
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          All File Converters & PDF Tools Hub
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Explore every client-side tool in PDFKit. Everything executes 100% locally on your machine with zero server latency or data collection.
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools (e.g. compress, sign, excel, ppt, crop)..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Category Pills / Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          All Tools ({TOOLS_CONFIG.length - 1})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTools.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-500/50 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${t.bgColor}`}>
                  {getToolIcon(t.icon)}
                </div>
                {t.badge && (
                  <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {t.name}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {t.tagline}
                </p>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="capitalize">{t.category.replace('-', ' ')}</span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Open</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
