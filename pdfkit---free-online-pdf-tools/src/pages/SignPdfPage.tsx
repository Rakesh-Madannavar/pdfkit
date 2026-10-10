import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Eraser, ArrowRight, Check, Move } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { FileDropzone } from '../components/FileDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultScreen } from '../components/ResultScreen';
import { signPdf } from '../utils/pdfSign';
import { loadPdfDocument, renderPageToDataUrl } from '../utils/pdfRenderer';
import { generateSamplePdf } from '../utils/samplePdf';
import { formatBytes } from '../utils/download';
import { ToolId, ProcessResult } from '../types/pdf';

interface SignPdfPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const SignPdfPage: React.FC<SignPdfPageProps> = ({ onBack, onNavigateToTool }) => {
  const tool = getToolConfig('sign')!;
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPageNum, setSelectedPageNum] = useState(1);
  const [pageThumbnail, setPageThumbnail] = useState<string | null>(null);

  // Signature state
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('Alex Mercer');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Position on target page (percentage from top-left)
  const [posX, setPosX] = useState(50); // % from left
  const [posY, setPosY] = useState(80); // % from top
  const [sigWidthPercent, setSigWidthPercent] = useState(30);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selected = selectedFiles[0];
    setFile(selected);
    setError(null);
    try {
      const buf = await selected.arrayBuffer();
      setBuffer(buf);
      const pdfDoc = await loadPdfDocument(buf);
      setPageCount(pdfDoc.numPages);
      setSelectedPageNum(pdfDoc.numPages); // usually signatures go on the last page!

      const { dataUrl } = await renderPageToDataUrl(pdfDoc, pdfDoc.numPages, 400);
      setPageThumbnail(dataUrl);
    } catch {
      setError('Could not read PDF document.');
    }
  };

  // Update page preview if user changes page number
  const handlePageChange = async (pageNum: number) => {
    setSelectedPageNum(pageNum);
    if (!buffer) return;
    try {
      const pdfDoc = await loadPdfDocument(buffer);
      const { dataUrl } = await renderPageToDataUrl(pdfDoc, pageNum, 400);
      setPageThumbnail(dataUrl);
    } catch {
      // ignore
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureDataUrl(null);
  };

  // Generate typed signature data url
  const generateTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 400, 140);
      ctx.font = 'italic 42px "Brush Script MT", "Caveat", "Segoe Script", cursive';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(typedName || 'Signature', 30, 85);
      return canvas.toDataURL('image/png');
    }
    return null;
  };

  const handleApplySignature = async () => {
    if (!buffer || !file) return;

    let finalSig = signatureDataUrl;
    if (signMode === 'type' || !finalSig) {
      finalSig = generateTypedSignature();
    }

    if (!finalSig) {
      setError('Please draw or type your signature before applying.');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    setProgressMessage('Embedding signature into document...');
    setError(null);

    try {
      const { blob, pageCount: count } = await signPdf(
        buffer,
        [
          {
            pageNumber: selectedPageNum,
            xPercent: posX,
            yPercent: posY,
            widthPercent: sigWidthPercent,
            signatureDataUrl: finalSig,
          },
        ],
        (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        }
      );

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${cleanName}_signed.pdf`,
        fileSize: blob.size,
        itemCount: count,
      });
    } catch (err: any) {
      console.error('Sign error:', err);
      setError(err.message || 'Failed to sign document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    const sample = await generateSamplePdf('Sample_Agreement.pdf');
    handleFileSelected([sample]);
  };

  useEffect(() => {
    document.title = 'Sign PDF - Electronic Signature Online | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack} error={error} onClearError={() => setError(null)}>
      {result ? (
        <ResultScreen
          blob={result.blob}
          filename={result.filename}
          itemCount={result.itemCount}
          itemCountLabel="Pages"
          onReset={() => {
            setResult(null);
            setFile(null);
            setBuffer(null);
            setProgress(0);
          }}
          onNavigateToTool={onNavigateToTool}
          nextSuggestedTool={{
            id: 'flatten',
            label: 'Flatten your signed PDF so the signature cannot be removed',
          }}
        />
      ) : !file ? (
        <div className="mx-auto max-w-2xl">
          <FileDropzone
            accept={tool.accepts}
            acceptLabel={tool.acceptLabel}
            multiple={false}
            onFilesSelected={handleFileSelected}
            sampleAction={{
              label: 'Try with Sample Contract',
              action: handleLoadSample,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Page Preview with interactive signature placement indicator */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sign on page:</span>
                <select
                  value={selectedPageNum}
                  onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Page {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-6 dark:border-slate-800 dark:bg-slate-900/40 flex flex-col items-center justify-center">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = ((e.clientX - rect.left) / rect.width) * 100;
                  const clickY = ((e.clientY - rect.top) / rect.height) * 100;
                  setPosX(Math.max(5, Math.min(75, Math.round(clickX))));
                  setPosY(Math.max(5, Math.min(85, Math.round(clickY))));
                }}
                className="relative aspect-[1/1.414] w-80 max-w-full rounded-xl bg-white shadow-xl dark:bg-slate-800 border border-slate-200/80 overflow-hidden cursor-crosshair"
              >
                {pageThumbnail && (
                  <img
                    src={pageThumbnail}
                    alt={`Page ${selectedPageNum}`}
                    className="h-full w-full object-contain pointer-events-none select-none"
                  />
                )}

                {/* Signature placement marker */}
                <div
                  className="absolute pointer-events-none border-2 border-dashed border-rose-500 bg-rose-500/15 rounded flex items-center justify-center p-1 transition-all"
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    width: `${sigWidthPercent}%`,
                    height: '12%',
                  }}
                >
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    Signature Here
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                <Move className="w-3.5 h-3.5" />
                <span>Click anywhere on the preview page above to position your signature</span>
              </p>
            </div>
          </div>

          {/* Right: Signature Creation Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <PenTool className="h-4 w-4 text-rose-600" />
                <span>Create Signature</span>
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignMode('draw')}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                    signMode === 'draw'
                      ? 'border-rose-500 bg-rose-50/60 text-rose-700 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignMode('type')}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                    signMode === 'type'
                      ? 'border-rose-500 bg-rose-50/60 text-rose-700 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  Type Signature
                </button>
              </div>

              {signMode === 'draw' ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl border border-slate-300 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair w-full h-[150px] touch-none"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="rounded bg-white/80 dark:bg-slate-700/80 p-1 text-xs text-slate-500 hover:text-rose-600 shadow-sm"
                        title="Clear drawing"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sign with your trackpad, mouse, or touch screen inside the box.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 text-center">
                    <span className="font-serif italic text-2xl text-slate-900 dark:text-white">
                      {typedName || 'Signature'}
                    </span>
                  </div>
                </div>
              )}

              {/* Size slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Signature Stamp Size</span>
                  <span className="font-mono text-[11px] text-slate-500">{sigWidthPercent}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={60}
                  value={sigWidthPercent}
                  onChange={(e) => setSigWidthPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {isProcessing && (
                <ProgressBar progress={progress} statusMessage={progressMessage} />
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApplySignature}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <span>Apply Signature to PDF</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
