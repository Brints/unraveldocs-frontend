/**
 * Document Models
 * Type definitions for the documents module based on API documentation
 */

// ==================== Document Collection ====================

/**
 * Collection as returned from GET /documents/my-collections
 */
export interface DocumentCollectionSummary {
  id: string;
  collectionStatus: CollectionStatus;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
  uploadTimestamp: string;
}

/**
 * Collection as returned from GET /documents/collection/{collectionId}
 */
export interface DocumentCollectionDetail {
  id: string;
  collectionStatus: CollectionStatus;
  files: DocumentFile[];
  createdAt: string;
  updatedAt: string;
  uploadTimestamp: string;
  userId: string;
}

/**
 * Unified collection interface for internal use
 */
export interface DocumentCollection {
  id: string;
  collectionStatus: CollectionStatus;
  fileCount: number;
  createdAt: string;
  updatedAt?: string;
  uploadTimestamp?: string;
  files?: DocumentFile[];
  userId?: string;
}

export type CollectionStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'completed'
  | 'failed'
  | 'failed_ocr';

export interface DocumentFile {
  documentId: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  status: FileStatus;
  mimeType?: string;
  ocrProcessed?: boolean;
  extractedText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FileStatus = 'success' | 'pending' | 'processing' | 'failed';

// Legacy type alias for backward compatibility
export type DocumentStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING';

// ==================== Upload ====================

export interface UploadResponse {
  collectionId: string;
  files: UploadedFile[];
  overallStatus: string;
}

export interface UploadedFile {
  documentId: string;
  originalFileName: string;
  fileSize: number;
  fileUrl: string;
  status: FileStatus;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// ==================== OCR ====================

export interface OcrResult {
  documentId: string;
  fileName: string;
  extractedText: string;
  confidence?: number;
  language?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface OcrCollectionResult {
  collectionId: string;
  results: OcrResult[];
}

export interface OcrData {
  documentId: string;
  fileName: string;
  extractedText: string;
  confidence: number;
}

// ==================== API Responses ====================

export interface DocumentApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

// ==================== Document State ====================

export interface DocumentsState {
  collections: DocumentCollection[];
  currentCollection: DocumentCollection | null;
  currentDocument: DocumentFile | null;
  uploadProgress: UploadProgress[];
  isLoading: boolean;
  isUploading: boolean;
  isProcessingOcr: boolean;
  error: string | null;
}

// ==================== Filter & Sort ====================

export interface DocumentFilter {
  status?: FileStatus;
  ocrProcessed?: boolean;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type DocumentSortField = 'fileName' | 'createdAt' | 'fileSize' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface DocumentSort {
  field: DocumentSortField;
  direction: SortDirection;
}

// ==================== Batch Operations ====================

export interface BatchOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
}

// ==================== View Modes ====================

export type ViewMode = 'grid' | 'list';

// ==================== File Types ====================

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/tiff': 'image',
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'default': 'document'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 10;

