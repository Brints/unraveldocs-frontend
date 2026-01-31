import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, map, forkJoin, of, switchMap, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OcrApiResponse,
  OcrExtractionResult,
  OcrCollectionResults,
  OcrData,
  UploadExtractResponse,
  OcrFileResult,
  OcrJob,
  OcrStatus,
} from '../models/ocr.model';

interface CollectionSummary {
  id: string;
  collectionStatus: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
  uploadTimestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class OcrApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== Load All OCR Jobs ====================

  /**
   * Get all collections and their OCR results
   * This combines the document collections API with OCR results
   */
  getAllCollectionsWithOcrResults(): Observable<OcrJob[]> {
    return this.http.get<{ data: CollectionSummary[] | null }>(`${this.apiUrl}/documents/my-collections`).pipe(
      switchMap(response => {
        const collections = response?.data || [];
        if (collections.length === 0) {
          return of([]);
        }

        // For each collection, fetch OCR results
        const ocrRequests = collections.map(collection =>
          this.getOcrResults(collection.id).pipe(
            map(results => this.mapResultsToJobs(collection, results)),
            catchError(() => of([] as OcrJob[]))
          )
        );

        return forkJoin(ocrRequests).pipe(
          map(results => results.flat().sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ))
        );
      }),
      catchError(error => {
        console.error('Failed to load collections:', error);
        return of([]);
      })
    );
  }

  /**
   * Map OCR results to OcrJob array
   */
  private mapResultsToJobs(collection: CollectionSummary, results: OcrCollectionResults): OcrJob[] {
    if (!results.files || results.files.length === 0) {
      return [];
    }

    return results.files.map((file, index) => ({
      id: `${collection.id}-${file.documentId}`,
      collectionId: collection.id,
      documentId: file.documentId,
      fileName: file.originalFileName,
      fileUrl: undefined,
      mimeType: this.getMimeTypeFromFileName(file.originalFileName),
      fileSize: undefined,
      status: this.mapApiStatus(file.status),
      progress: this.getProgressFromStatus(file.status),
      extractedText: file.extractedText || undefined,
      confidence: undefined, // API doesn't return confidence in list
      language: undefined,
      error: file.errorMessage || undefined,
      startedAt: undefined,
      completedAt: file.status === 'completed' ? file.createdAt : undefined,
      createdAt: file.createdAt
    }));
  }

  /**
   * Map API status string to OcrStatus
   */
  private mapApiStatus(status: string): OcrStatus {
    const s = status?.toLowerCase();
    switch (s) {
      case 'success':
      case 'completed':
        return 'COMPLETED';
      case 'processing':
        return 'PROCESSING';
      case 'failed':
        return 'FAILED';
      case 'pending':
      default:
        return 'PENDING';
    }
  }

  /**
   * Get progress percentage from status
   */
  private getProgressFromStatus(status: string): number {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed':
      case 'success':
      case 'failed':
        return 100;
      case 'processing':
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Infer MIME type from file name
   */
  private getMimeTypeFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  // ==================== OCR Extraction ====================

  /**
   * Extract text from a specific document
   * POST /collections/{collectionId}/document/{documentId}/extract
   */
  extractText(collectionId: string, documentId: string): Observable<OcrExtractionResult> {
    return this.http.post<OcrApiResponse<OcrExtractionResult>>(
      `${this.apiUrl}/collections/${collectionId}/document/${documentId}/extract`,
      {}
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Upload files and extract text from all
   * POST /collections/upload/extract-all
   */
  uploadAndExtractAll(files: File[]): Observable<HttpEvent<OcrApiResponse<UploadExtractResponse>>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const req = new HttpRequest('POST', `${this.apiUrl}/collections/upload/extract-all`, formData, {
      reportProgress: true
    });

    return this.http.request<OcrApiResponse<UploadExtractResponse>>(req);
  }

  // ==================== OCR Results ====================

  /**
   * Get OCR results for a collection
   * GET /collections/{collectionId}/document/results
   */
  getOcrResults(collectionId: string): Observable<OcrCollectionResults> {
    return this.http.get<OcrApiResponse<any>>(
      `${this.apiUrl}/collections/${collectionId}/document/results`
    ).pipe(
      map(response => this.mapToOcrCollectionResults(response.data))
    );
  }

  /**
   * Map API response to OcrCollectionResults
   */
  private mapToOcrCollectionResults(data: any): OcrCollectionResults {
    if (!data) {
      return { collectionId: '', files: [], overallStatus: 'processing' };
    }
    return {
      collectionId: data.collectionId || '',
      files: (data.files || []).map((f: any) => this.mapToOcrFileResult(f)),
      overallStatus: data.overallStatus || 'processing'
    };
  }

  /**
   * Map API file to OcrFileResult
   */
  private mapToOcrFileResult(data: any): OcrFileResult {
    return {
      documentId: data.documentId || '',
      originalFileName: data.originalFileName || 'Unknown',
      status: data.status || 'pending',
      extractedText: data.extractedText || null,
      errorMessage: data.errorMessage || null,
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  /**
   * Get OCR data for a specific document
   * GET /collections/{collectionId}/document/{documentId}/ocr-data
   */
  getOcrData(collectionId: string, documentId: string): Observable<OcrData> {
    return this.http.get<OcrApiResponse<OcrData>>(
      `${this.apiUrl}/collections/${collectionId}/document/${documentId}/ocr-data`
    ).pipe(map(response => response.data));
  }

  // ==================== Word Export ====================

  /**
   * Download OCR result as DOCX
   * GET /collections/{collectionId}/documents/{documentId}/download/docx
   */
  downloadAsDocx(collectionId: string, documentId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/collections/${collectionId}/documents/${documentId}/download/docx`,
      { responseType: 'blob' }
    );
  }

  /**
   * Download OCR result as plain text
   */
  downloadAsText(text: string, fileName: string): void {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(blob, `${fileName}.txt`);
  }

  /**
   * Download OCR result as JSON
   */
  downloadAsJson(data: OcrData, fileName: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${fileName}.json`);
  }

  // ==================== Delete Operations ====================

  /**
   * Delete a specific document
   * DELETE /documents/collection/{collectionId}/document/{documentId}
   */
  deleteDocument(collectionId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/documents/collection/${collectionId}/document/${documentId}`
    );
  }

  /**
   * Clear all documents
   * DELETE /documents/clear-all
   */
  clearAllDocuments(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/clear-all`);
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

