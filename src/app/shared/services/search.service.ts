import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SearchRequest,
  SearchResponse,
  SearchResult,
} from '../models/search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Advanced document search with POST request
   * POST /search/documents
   */
  searchDocuments(request: SearchRequest): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(
      `${this.apiUrl}/search/documents`,
      request
    ).pipe(
      map(response => this.normalizeResponse(response)),
      catchError(error => {
        console.error('Search error:', error);
        return of(this.emptyResponse());
      })
    );
  }

  /**
   * Quick document search with GET request
   * GET /search/documents
   */
  quickSearch(
    query: string,
    page = 0,
    size = 10,
    sortBy = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<SearchResponse> {
    let params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<SearchResponse>(
      `${this.apiUrl}/search/documents`,
      { params }
    ).pipe(
      map(response => this.normalizeResponse(response)),
      catchError(error => {
        console.error('Quick search error:', error);
        return of(this.emptyResponse());
      })
    );
  }

  /**
   * Search document content (full-text search)
   * GET /search/documents/content
   */
  searchContent(query: string, page = 0, size = 10): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResponse>(
      `${this.apiUrl}/search/documents/content`,
      { params }
    ).pipe(
      map(response => this.normalizeResponse(response)),
      catchError(error => {
        console.error('Content search error:', error);
        return of(this.emptyResponse());
      })
    );
  }

  /**
   * Normalize API response to handle null values
   */
  private normalizeResponse(response: any): SearchResponse {
    return {
      results: (response.results || []).map((r: any) => this.normalizeResult(r)),
      totalHits: response.totalHits || 0,
      page: response.page || 0,
      size: response.size || 10,
      totalPages: response.totalPages || 0,
      took: response.took,
      highlights: response.highlights || {},
      facets: response.facets || {}
    };
  }

  /**
   * Normalize a single search result
   */
  private normalizeResult(result: any): SearchResult {
    return {
      id: result.id || '',
      collectionId: result.collectionId || '',
      fileName: result.fileName || 'Unknown',
      fileType: result.fileType || 'application/octet-stream',
      fileSize: result.fileSize || 0,
      status: result.status || 'UNKNOWN',
      ocrStatus: result.ocrStatus || 'UNKNOWN',
      textPreview: result.textPreview || null,
      highlights: result.highlights || [],
      fileUrl: result.fileUrl || '',
      uploadTimestamp: result.uploadTimestamp || '',
      createdAt: result.createdAt || '',
      score: result.score
    };
  }

  /**
   * Return empty response for error cases
   */
  private emptyResponse(): SearchResponse {
    return {
      results: [],
      totalHits: 0,
      page: 0,
      size: 10,
      totalPages: 0,
      took: null,
      highlights: {},
      facets: {}
    };
  }
}

