import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { FileArchive, Download, Plus, Trash2, File, ArrowRight } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { formatBytes, triggerDownload, createZipFile } from '../utils/download';
import { ToolId } from '../types/pdf';

interface ZipToolPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

interface ZipEntryItem {
  name: string;
  size: number;
  blob: Blob;
}

export const ZipToolPage: React.FC<ZipToolPageProps> = ({ onBack }) => {
  const tool = getToolConfig('zip-tool')!;
  const [mode, setMode] = useState<'create' | 'extract'>('create');
  const [filesToZip, setFilesToZip] = useState<File[]>([]);
  const [extractedEntries, setExtractedEntries] = useState<ZipEntryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [archiveName, setArchiveName] = useState('archive.zip');
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    if (mode === 'create') {
      setFilesToZip((prev) => [...prev, ...files]);
    } else {
      // Extract mode: Expecting a .zip file
      const zipFile = files[0];
      if (!zipFile.name.toLowerCase().endsWith('.zip')) {
        setError('Please choose a .zip file to extract.');
        return;
      }
      setIsProcessing(true);
      setProgress(20);

      try {
        const buffer = await zipFile.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const entries: ZipEntryItem[] = [];

        const filePaths = Object.keys(zip.files).filter((k) => !zip.files[k].dir);
        for (const path of filePaths) {
          const blob = await zip.files[path].async('blob');
          entries.push({
            name: path,
            size: blob.size,
            blob,
          });
        }
        setExtractedEntries(entries);
        setProgress(100);
      } catch (err: any) {
        console.error('ZIP extraction error:', err);
        setError('Failed to extract ZIP archive.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCreateZip = async () => {
    if (filesToZip.length === 0) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      const items = filesToZip.map((f) => ({ name: f.name, content: f }));
      const zipBlob = await createZipFile(items, (p) => setProgress(p));
      triggerDownload(zipBlob, archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`);
    } catch (err: any) {
      console.error('ZIP creation error:', err);
      setError('Failed to create ZIP package.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    document.title = 'ZIP & Unzip Tool - Manage ZIP Archives Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Mode switch */}
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setExtractedEntries([]);
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
              mode === 'create'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <FileArchive className="h-4 w-4" />
            <span>Create ZIP Archive</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('extract');
              setFilesToZip([]);
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
              mode === 'extract'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Unpack & Extract ZIP</span>
          </button>
        </div>

        {mode === 'create' ? (
          filesToZip.length === 0 ? (
            <FileDropzone
              accept="*"
              acceptLabel="any files"
              multiple={true}
              onFilesSelected={handleFilesSelected}
              helperText="Select or drop any files to compress into a ZIP archive"
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {filesToZip.length} files selected for ZIP compression
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total: {formatBytes(filesToZip.reduce((acc, f) => acc + f.size, 0))}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={archiveName}
                    onChange={(e) => setArchiveName(e.target.value)}
                    placeholder="archive.zip"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleCreateZip}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-amber-500 disabled:opacity-50"
                  >
                    <span>Download ZIP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filesToZip.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div className="truncate max-w-[180px]">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{formatBytes(f.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilesToZip(filesToZip.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          extractedEntries.length === 0 ? (
            <FileDropzone
              accept=".zip,application/zip,application/x-zip-compressed"
              acceptLabel=".zip archive"
              multiple={false}
              onFilesSelected={handleFilesSelected}
              helperText="Upload any ZIP file to unpack its contents locally in your browser"
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {extractedEntries.length} files unpacked from ZIP
                </span>
                <button
                  type="button"
                  onClick={() => setExtractedEntries([])}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Unpack another ZIP
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {extractedEntries.map((item, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-md">
                      <File className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                      <span className="text-slate-400 font-mono">({formatBytes(item.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerDownload(item.blob, item.name)}
                      className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </ToolLayout>
  );
};
