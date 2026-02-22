/**
 * AI Operations Models
 * Type definitions for AI summarization and classification
 */

// ==================== Summary Types ====================

export type SummaryType = 'SHORT' | 'DETAILED';

export type ModelPreference = 'openai' | 'mistral';

export type BillingSource = 'subscription' | 'credits';

// ==================== Document Types ====================

export type AiDocumentType =
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'letter'
  | 'id_document'
  | 'medical'
  | 'legal'
  | 'academic'
  | 'report'
  | 'form'
  | 'other';

// ==================== Summarize Request ====================

export interface SummarizeRequest {
  documentId: string;
  summaryType?: SummaryType;
  modelPreference?: ModelPreference;
}

// ==================== Summarize Response ====================

export interface SummarizeResponse {
  documentId: string;
  summary: string;
  summaryType: SummaryType;
  modelUsed: string;
  creditsCharged: number;
  billingSource: BillingSource;
}

// ==================== Classify Response ====================

export interface ClassifyResponse {
  documentId: string;
  documentType: AiDocumentType;
  tags: string[];
  confidence: number;
  modelUsed: string;
  creditsCharged: number;
  billingSource: BillingSource;
}

// ==================== AI API Response ====================

export interface AiApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

// ==================== AI State ====================

export interface AiOperationState<T> {
  isLoading: boolean;
  result: T | null;
  error: string | null;
}

