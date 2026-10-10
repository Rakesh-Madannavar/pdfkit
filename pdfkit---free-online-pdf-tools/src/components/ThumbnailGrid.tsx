import React, { useState } from 'react';
import { 
  RotateCw, 
  Trash2, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  GripVertical,
  FileText
} from 'lucide-react';
import { PdfPageItem } from '../types/pdf';

interface ThumbnailGridProps {
  items: PdfPageItem[];
  onReorder: (newItems: PdfPageItem[]) => void;
  onRotate?: (id: string, degreesToAdd: number) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  allowRotate?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  items,
  onReorder,
  onRotate,
  onDelete,
  onDuplicate,
  allowRotate = true,
  allowDelete = true,
  allowDuplicate = true,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const sourceIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...items];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    onReorder(updated);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onReorder(updated);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, index) => {
        const isDragging = draggedId === item.id;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            className={`group relative flex flex-col rounded-xl border bg-white p-2.5 shadow-sm transition-all dark:bg-slate-900 ${
              isDragging
                ? 'opacity-40 scale-95 border-rose-500 shadow-md ring-2 ring-rose-500/30'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:shadow-md'
            }`}
          >
            {/* Drag Handle & Page Indicator */}
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Page {index + 1}
                </span>
              </div>

              {/* Move buttons for mobile / keyboard */}
              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 dark:hover:text-white"
                  title="Move page left"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 dark:hover:text-white"
                  title="Move page right"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Thumbnail Canvas / Image */}
            <div className="relative aspect-[1/1.35] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={`Thumbnail page ${index + 1}`}
                  className="h-full w-full object-contain transition-transform duration-200"
                  style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <FileText className="h-8 w-8 stroke-[1.5]" />
                  <span className="text-[10px]">Page {index + 1}</span>
                </div>
              )}

              {/* Angle indicator if rotated */}
              {item.rotation !== 0 && (
                <div className="absolute top-1.5 right-1.5 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-mono text-white backdrop-blur-sm">
                  {item.rotation}°
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="mt-2.5 flex items-center justify-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              {allowRotate && onRotate && (
                <button
                  type="button"
                  onClick={() => onRotate(item.id, 90)}
                  className="p-1.5 rounded-md text-slate-600 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                  title="Rotate 90° clockwise"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              )}

              {allowDuplicate && onDuplicate && (
                <button
                  type="button"
                  onClick={() => onDuplicate(item.id)}
                  className="p-1.5 rounded-md text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
                  title="Duplicate page"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}

              {allowDelete && onDelete && (
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-20 transition-colors"
                  title="Delete page"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
