import React, { useState, useEffect } from 'react';
import { Table, Download, ListFilter, FileCode, CheckCircle2 } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { 
  convertExcelToCsv, 
  convertExcelToJson, 
  convertExcelToHtml, 
  removeExcelDuplicates 
} from '../utils/officeTools';
import { triggerDownload } from '../utils/download';
import { ToolId } from '../types/pdf';

interface ExcelToolsPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const ExcelToolsPage: React.FC<ExcelToolsPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('excel-converter')!;
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'convert' | 'dedup'>('convert');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<string>('');
  const [dedupStats, setDedupStats] = useState<{ original: number; unique: number; removed: number; blob: Blob } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    setIsProcessing(true);

    try {
      const csvRes = await convertExcelToCsv(selected);
      const jsonRes = await convertExcelToJson(selected);
      const htmlRes = await convertExcelToHtml(selected);
      const dedupRes = await removeExcelDuplicates(selected);

      setCsvContent(csvRes.csvText);
      setJsonContent(jsonRes.jsonString);
      setPreviewHtml(htmlRes.htmlString);
      setDedupStats({
        original: dedupRes.originalRows,
        unique: dedupRes.uniqueRows,
        removed: dedupRes.duplicatesRemoved,
        blob: dedupRes.blob,
      });
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setError('Could not parse Excel document. Ensure it is a valid .xlsx or .xls file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!csvContent || !file) return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(blob, `${cleanName}.csv`);
  };

  const handleDownloadJson = () => {
    if (!jsonContent || !file) return;
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(blob, `${cleanName}.json`);
  };

  const handleDownloadDedup = () => {
    if (!dedupStats || !file) return;
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    triggerDownload(dedupStats.blob, `${cleanName}_deduplicated.xlsx`);
  };

  useEffect(() => {
    document.title = 'Excel Tools - Convert to CSV, JSON & Remove Duplicates | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {!file ? (
        <div className="mx-auto max-w-2xl">
          <FileDropzone
            accept=".xlsx,.xls,.csv"
            acceptLabel="Excel .xlsx or .csv files"
            multiple={false}
            onFilesSelected={handleFileSelected}
            helperText="Convert Excel to CSV/JSON/HTML or remove duplicate rows locally via SheetJS"
          />
        </div>
      ) : isProcessing ? (
        <div className="mx-auto max-w-xl">
          <ProgressBar progress={60} statusMessage="Processing spreadsheet records..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Tabs & Download bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</h3>
              <p className="text-xs text-slate-500 font-mono">
                {dedupStats?.original} rows detected
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Download JSON</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDedup}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Deduplicated Excel ({dedupStats?.removed} removed)</span>
              </button>
            </div>
          </div>

          {/* Deduplication Summary Card */}
          {dedupStats && dedupStats.removed > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Removed {dedupStats.removed} redundant duplicate rows. Clean dataset has {dedupStats.unique} unique rows.
                </span>
              </div>
            </div>
          )}

          {/* HTML Spreadsheet Table Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interactive Spreadsheet Preview
            </h4>
            <div 
              className="max-h-[460px] overflow-auto text-xs [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 dark:[&_th]:border-slate-800 dark:[&_th]:bg-slate-800 dark:[&_td]:border-slate-800"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
