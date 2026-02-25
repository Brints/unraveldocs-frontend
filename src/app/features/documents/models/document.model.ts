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
  name: string;
  collectionStatus: CollectionStatus;
  fileCount: number;
  hasEncryptedFiles: boolean;
  createdAt: string;
  updatedAt: string;
  uploadTimestamp: string;
}

/**
 * Collection as returned from GET /documents/collection/{collectionId}
 */
export interface DocumentCollectionDetail {
  id: string;
  name: string;
  collectionStatus: CollectionStatus;
  files: DocumentFile[];
  hasEncryptedFiles?: boolean;
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
  name: string;
  collectionStatus: CollectionStatus;
  fileCount: number;
  hasEncryptedFiles: boolean;
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
  | 'failed_ocr'
  | 'partially_completed'
  | 'failed_upload';

export interface DocumentFile {
  documentId: string;
  originalFileName: string;
  displayName: string | null;
  fileUrl: string;
  fileSize: number;
  status: FileStatus;
  encrypted: boolean;
  mimeType?: string;
  ocrProcessed?: boolean;
  extractedText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FileStatus = 'success' | 'pending' | 'processing' | 'failed' | 'failed_validation' | 'failed_storage_upload';

// ==================== Move Document ====================

export interface MoveDocumentRequest {
  sourceCollectionId: string;
  targetCollectionId: string;
  documentId: string;
}

// ==================== Update Requests ====================

export interface UpdateCollectionRequest {
  name: string;
}

export interface UpdateDocumentRequest {
  displayName: string;
}

// ==================== Upload Options ====================

export interface UploadOptions {
  collectionName?: string;
  enableEncryption?: boolean;
}

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
  displayName: string | null;
  fileSize: number;
  fileUrl: string;
  status: FileStatus;
  encrypted: boolean;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// ==================== Content Format ====================

export type ContentFormat = 'HTML' | 'MARKDOWN';

// ==================== OCR ====================

export interface OcrResult {
  documentId: string;
  fileName: string;
  extractedText: string;
  editedContent?: string | null;
  contentFormat?: ContentFormat | null;
  editedBy?: string | null;
  editedAt?: string | null;
  aiSummary?: string | null;
  documentType?: string | null;
  aiTags?: string[] | null;
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
  originalFileName: string;
  status: string;
  extractedText: string;
  editedContent: string | null;
  contentFormat: ContentFormat | null;
  editedBy: string | null;
  editedAt: string | null;
  errorMessage: string | null;
  aiSummary: string | null;
  documentType: string | null;
  aiTags: string[] | null;
  createdAt: string;
}

// ==================== Page Selection Options ====================

export interface PageSelectionOptions {
  startPage?: number;
  endPage?: number;
  pages?: number[];
}

// ==================== Update Content Request ====================

export interface UpdateOcrContentRequest {
  editedContent: string;
  contentFormat: ContentFormat;
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

