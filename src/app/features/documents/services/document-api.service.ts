import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DocumentApiResponse,
  DocumentCollection,
  DocumentFile,
  UploadResponse,
  OcrResult,
  OcrCollectionResult,
  OcrData,
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== Document Upload ====================

  /**
   * Upload documents
   * POST /documents/upload
   */
  uploadDocuments(files: File[]): Observable<HttpEvent<DocumentApiResponse<UploadResponse>>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const req = new HttpRequest('POST', `${this.apiUrl}/documents/upload`, formData, {
      reportProgress: true
    });

    return this.http.request<DocumentApiResponse<UploadResponse>>(req);
  }

  /**
   * Upload documents and extract text from all
   * POST /collections/upload/extract-all
   */
  uploadAndExtractAll(files: File[]): Observable<HttpEvent<DocumentApiResponse<UploadResponse>>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const req = new HttpRequest('POST', `${this.apiUrl}/collections/upload/extract-all`, formData, {
      reportProgress: true
    });

    return this.http.request<DocumentApiResponse<UploadResponse>>(req);
  }

  // ==================== Collections ====================

  /**
   * Get all user collections
   * GET /documents/my-collections
   */
  getMyCollections(): Observable<DocumentCollection[]> {
    return this.http.get<DocumentApiResponse<DocumentCollection[]>>(
      `${this.apiUrl}/documents/my-collections`
    ).pipe(map(response => response.data));
  }

  /**
   * Get collection by ID
   * GET /documents/collection/{collectionId}
   */
  getCollection(collectionId: string): Observable<DocumentCollection> {
    return this.http.get<DocumentApiResponse<DocumentCollection>>(
      `${this.apiUrl}/documents/collection/${collectionId}`
    ).pipe(map(response => response.data));
  }

  /**
   * Delete collection
   * DELETE /documents/collection/{collectionId}
   */
  deleteCollection(collectionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/documents/collection/${collectionId}`
    );
  }

  /**
   * Clear all collections
   * DELETE /documents/clear-all
   */
  clearAllCollections(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/clear-all`);
  }

  // ==================== Documents ====================

  /**
   * Get file from collection
   * GET /documents/collection/{collectionId}/document/{documentId}
   */
  getDocument(collectionId: string, documentId: string): Observable<DocumentFile> {
    return this.http.get<DocumentApiResponse<DocumentFile>>(
      `${this.apiUrl}/documents/collection/${collectionId}/document/${documentId}`
    ).pipe(map(response => response.data));
  }

  /**
   * Delete file from collection
   * DELETE /documents/collection/{collectionId}/document/{documentId}
   */
  deleteDocument(collectionId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/documents/collection/${collectionId}/document/${documentId}`
    );
  }

  // ==================== OCR Processing ====================

  /**
   * Extract text from file
   * POST /collections/{collectionId}/document/{documentId}/extract
   */
  extractText(collectionId: string, documentId: string): Observable<OcrResult> {
    return this.http.post<DocumentApiResponse<OcrResult>>(
      `${this.apiUrl}/collections/${collectionId}/document/${documentId}/extract`,
      {}
    ).pipe(map(response => response.data));
  }

  /**
   * Get OCR results for collection
   * GET /collections/{collectionId}/document/results
   */
  getOcrResults(collectionId: string): Observable<OcrCollectionResult> {
    return this.http.get<DocumentApiResponse<OcrCollectionResult>>(
      `${this.apiUrl}/collections/${collectionId}/document/results`
    ).pipe(map(response => response.data));
  }

  /**
   * Get OCR data for specific document
   * GET /collections/{collectionId}/document/{documentId}/ocr-data
   */
  getOcrData(collectionId: string, documentId: string): Observable<OcrData> {
    return this.http.get<DocumentApiResponse<OcrData>>(
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

  // ==================== Helper Methods ====================

  /**
   * Get upload progress percentage from HttpEvent
   */
  getUploadProgress(event: HttpEvent<unknown>): number | null {
    if (event.type === HttpEventType.UploadProgress && event.total) {
      return Math.round((event.loaded / event.total) * 100);
    }
    return null;
  }

  /**
   * Check if event is upload complete
   */
  isUploadComplete(event: HttpEvent<unknown>): boolean {
    return event.type === HttpEventType.Response;
  }
}

