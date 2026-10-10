import React, { useState, useEffect } from 'react';
import { QrCode, Download, Settings2, Sparkles } from 'lucide-react';
import { getToolConfig } from '../utils/toolsConfig';
import { ToolLayout } from '../components/ToolLayout';
import { generateQrCode } from '../utils/qrGenerator';
import { triggerDownload } from '../utils/download';
import { ToolId } from '../types/pdf';

interface QrGeneratorPageProps {
  onBack: () => void;
  onNavigateToTool: (tool: ToolId) => void;
}

export const QrGeneratorPage: React.FC<QrGeneratorPageProps> = ({ onBack }) => {
  const tool = getToolConfig('qr-generator')!;
  const [text, setText] = useState('https://pdfkit.app');
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    let active = true;
    const generate = async () => {
      if (!text.trim()) return;
      try {
        const res = await generateQrCode({
          text,
          width: 320,
          darkColor,
          lightColor,
          errorCorrectionLevel: errorCorrection,
        });
        if (active) {
          setDataUrl(res.dataUrl);
          setSvgString(res.svgString);
        }
      } catch (err) {
        console.error('QR generation error:', err);
      }
    };
    generate();
    return () => { active = false; };
  }, [text, darkColor, lightColor, errorCorrection]);

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, 'qrcode.svg');
  };

  useEffect(() => {
    document.title = 'QR Code Generator - Free High-Res QR Codes | PDFKit';
  }, []);

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
        {/* Left: Interactive Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 shadow-inner">
            {dataUrl ? (
              <img src={dataUrl} alt="Generated QR code" className="w-64 h-64 object-contain rounded-lg" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-orange-500 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SVG</span>
            </button>
          </div>
        </div>

        {/* Right: Inputs & Customization */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Settings2 className="h-4 w-4 text-indigo-600" />
            <span>QR Configuration</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Content / URL / Text
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. https://yourwebsite.com or Wi-Fi code"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {['https://google.com', 'WIFI:S:MyWifi;T:WPA;P:secret123;;', 'mailto:contact@example.com'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setText(preset)}
                className="px-2 py-1 rounded-md text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 truncate max-w-[200px]"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Foreground Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border p-0"
                />
                <span className="font-mono text-xs">{darkColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border p-0"
                />
                <span className="font-mono text-xs">{lightColor}</span>
              </div>
            </div>
          </div>

          {/* Error correction */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Error Correction Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'L', label: 'Low (7%)' },
                { id: 'M', label: 'Medium (15%)' },
                { id: 'Q', label: 'Quartile (25%)' },
                { id: 'H', label: 'High (30%)' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setErrorCorrection(lvl.id as any)}
                  className={`rounded-xl border py-2 text-[11px] font-semibold transition-all ${
                    errorCorrection === lvl.id
                      ? 'border-indigo-500 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
