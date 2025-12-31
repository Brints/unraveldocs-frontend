/**
 * OCR Processing Models
 * Type definitions for OCR processing module
 */

// ==================== OCR Status ====================

export type OcrStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

// ==================== OCR Job ====================

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
  confidence?: number;
  language?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ==================== OCR Result ====================

export interface OcrExtractionResult {
  documentId: string;
  extractedText: string;
  confidence: number;
  language: string;
}

export interface OcrCollectionResults {
  collectionId: string;
  results: OcrDocumentResult[];
}

export interface OcrDocumentResult {
  documentId: string;
  fileName: string;
  extractedText: string;
  status: OcrStatus;
  confidence?: number;
}

// ==================== OCR Data ====================

export interface OcrData {
  documentId: string;
  fileName: string;
  extractedText: string;
  confidence: number;
}

// ==================== OCR Queue ====================

export interface OcrQueueItem {
  id: string;
  collectionId: string;
  documentId: string;
  fileName: string;
  status: OcrStatus;
  progress: number;
  addedAt: string;
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

