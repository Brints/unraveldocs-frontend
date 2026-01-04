/**
 * Search Models
 * Type definitions for Elasticsearch search functionality
 */

// ==================== Search Request ====================

export interface SearchRequest {
  query: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters?: SearchFilters;
}

export interface SearchFilters {
  status?: string;
  ocrStatus?: string;
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  collectionId?: string;
}

// ==================== Search Response ====================

export interface SearchResponse {
  results: SearchResult[];
  totalHits: number;
  page: number;
  size: number;
  totalPages: number;
  took: number | null;
  highlights: Record<string, string[]>;
  facets: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  collectionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  ocrStatus: string;
  textPreview: string | null;
  highlights: string[];
  fileUrl: string;
  uploadTimestamp: string;
  createdAt: string;
  score: number | null;
}

// ==================== Search State ====================

export interface SearchState {
  query: string;
  results: SearchResult[];
  totalHits: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}

// ==================== Page Size Options ====================

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

// ==================== Sort Options ====================

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'fileName', label: 'File Name' },
  { value: 'fileSize', label: 'File Size' },
  { value: 'uploadTimestamp', label: 'Upload Date' }
];

