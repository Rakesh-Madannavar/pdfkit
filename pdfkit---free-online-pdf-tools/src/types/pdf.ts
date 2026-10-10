export type ToolCategory = 
  | 'organize' 
  | 'optimize' 
  | 'convert-to-pdf' 
  | 'convert-from-pdf' 
  | 'edit-security' 
  | 'office' 
  | 'addons';

export type ToolId = 
  // Organize
  | 'merge' 
  | 'split' 
  | 'extract-pages'
  | 'remove-pages'
  | 'organize' 
  | 'rotate' 
  | 'crop'
  // Optimize
  | 'compress'
  | 'repair'
  | 'flatten'
  | 'ocr'
  // Convert to PDF
  | 'jpg-to-pdf' 
  | 'text-to-pdf'
  | 'html-to-pdf'
  // Convert from PDF
  | 'pdf-to-jpg' 
  | 'pdf-to-text'
  | 'pdf-to-html'
  // Edit & Security
  | 'page-numbers' 
  | 'watermark'
  | 'sign'
  | 'redact'
  | 'metadata'
  // Office Tools
  | 'word-to-text'
  | 'word-counter'
  | 'ppt-extract-images'
  | 'ppt-extract-text'
  | 'excel-converter'
  | 'excel-remove-duplicates'
  // Add-ons
  | 'image-tools'
  | 'qr-generator'
  | 'zip-tool'
  | 'hub';

export interface ToolMeta {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  icon: string;
  color: string;
  bgColor: string;
  accepts: string;
  acceptLabel: string;
  multiple: boolean;
  maxFiles?: number;
  badge?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  thumbnailUrl?: string;
  arrayBuffer?: ArrayBuffer;
}

export interface PdfPageItem {
  id: string;
  originalPageIndex: number;
  displayPageNumber: number;
  rotation: number;
  thumbnailUrl?: string;
  sourceFileId?: string;
  isDeleted?: boolean;
}

export interface ProcessResult {
  blob: Blob;
  filename: string;
  downloadUrl?: string;
  fileSize: number;
  itemCount?: number;
  isZip?: boolean;
}
