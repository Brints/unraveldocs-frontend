/**
 * OCR Processing Models
 * Type definitions for OCR processing module
 */

// ==================== OCR Status ====================

export type OcrStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type OcrOverallStatus =
  | 'processing'
  | 'processed'
  | 'failed_ocr'
  | 'completed';

// ==================== Content Format ====================

export type ContentFormat = 'HTML' | 'MARKDOWN';

// ==================== Page Selection Options ====================

/**
 * Options for selecting specific pages during PDF OCR extraction
 */
export interface PageSelectionOptions {
  startPage?: number;
  endPage?: number;
  pages?: number[];
}

// ==================== OCR Extraction Result ====================

/**
 * Response from POST /collections/{collectionId}/document/{documentId}/extract
 */
export interface OcrExtractionResult {
  id: string;
  documentId: string;
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
  updatedAt: string;
}

// ==================== Update Content Request ====================

export interface UpdateOcrContentRequest {
  editedContent: string;
  contentFormat: ContentFormat;
}

// ==================== Upload and Extract All ====================

/**
 * Response from POST /collections/upload/extract-all
 */
export interface UploadExtractResponse {
  collectionId: string;
  files: UploadedOcrFile[];
  overallStatus: string;
}

export interface UploadedOcrFile {
  documentId: string;
  originalFileName: string;
  fileSize: number;
  fileUrl: string;
  status: string;
}

// ==================== OCR Collection Results ====================

/**
 * Response from GET /collections/{collectionId}/document/results
 */
export interface OcrCollectionResults {
  collectionId: string;
  files: OcrFileResult[];
  overallStatus: OcrOverallStatus;
}

export interface OcrFileResult {
  documentId: string;
  originalFileName: string;
  status: string;
  extractedText: string | null;
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

// ==================== OCR Data ====================

/**
 * Response from GET /collections/{collectionId}/document/{documentId}/ocr-data
 */
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

// ==================== OCR Job (Internal State) ====================

export interface OcrJob {
  id: string;
  collectionId: string;
  documentId: string;
  fileName: string;
  fileUrl?: string;
  mimeType?: string;
  fileSize?: number;
  status: OcrStatus;
  progress: number;
  extractedText?: string;
  editedContent?: string;
  contentFormat?: ContentFormat;
  editedBy?: string;
  editedAt?: string;
  aiSummary?: string;
  documentType?: string;
  aiTags?: string[];
  confidence?: number;
  language?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ==================== OCR Statistics ====================

export interface OcrStats {
  totalProcessed: number;
  totalPending: number;
  totalFailed: number;
  averageConfidence: number;
  pagesProcessedToday: number;
  pagesRemaining: number;
  monthlyLimit: number;
}

// ==================== API Responses ====================

export interface OcrApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

// ==================== View State ====================

export interface OcrViewState {
  jobs: OcrJob[];
  selectedJob: OcrJob | null;
  stats: OcrStats | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
  filter: OcrFilterOptions;
}

export interface OcrFilterOptions {
  status?: OcrStatus;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ==================== Export Options ====================

export type ExportFormat = 'txt' | 'docx' | 'pdf' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  preserveFormatting: boolean;
}

// ==================== Language Detection ====================

export interface LanguageInfo {
  code: string;
  name: string;
  confidence: number;
}

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'pl': 'Polish',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'id': 'Indonesian',
  'unknown': 'Unknown'
};

