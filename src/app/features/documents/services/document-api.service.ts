import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DocumentApiResponse,
  DocumentCollection,
  DocumentCollectionSummary,
  DocumentCollectionDetail,
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
    return this.http.get<DocumentApiResponse<DocumentCollectionSummary[] | null>>(
      `${this.apiUrl}/documents/my-collections`
    ).pipe(
      map(response => {
        const data = response?.data;
        if (!data || !Array.isArray(data)) {
          return [];
        }
        return data.map(item => this.mapToDocumentCollection(item));
      })
    );
  }

  /**
   * Get collection by ID
   * GET /documents/collection/{collectionId}
   */
  getCollection(collectionId: string): Observable<DocumentCollection | null> {
    return this.http.get<DocumentApiResponse<DocumentCollectionDetail | null>>(
      `${this.apiUrl}/documents/collection/${collectionId}`
    ).pipe(
      map(response => {
        const data = response?.data;
        if (!data) {
          return null;
        }
        return this.mapDetailToDocumentCollection(data);
      })
    );
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
  getDocument(collectionId: string, documentId: string): Observable<DocumentFile | null> {
    return this.http.get<DocumentApiResponse<any>>(
      `${this.apiUrl}/documents/collection/${collectionId}/document/${documentId}`
    ).pipe(
      map(response => {
        const data = response?.data;
        if (!data) {
          return null;
        }
        return this.mapToDocumentFile(data);
      })
    );
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

  // ==================== Mapping Methods ====================

  /**
   * Map API collection summary to unified DocumentCollection
   */
  private mapToDocumentCollection(data: DocumentCollectionSummary): DocumentCollection {
    return {
      id: data.id,
      collectionStatus: data.collectionStatus || 'pending',
      fileCount: data.fileCount || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      uploadTimestamp: data.uploadTimestamp,
    };
  }

  /**
   * Map API collection detail to unified DocumentCollection
   */
  private mapDetailToDocumentCollection(data: DocumentCollectionDetail): DocumentCollection {
    return {
      id: data.id,
      collectionStatus: data.collectionStatus || 'pending',
      fileCount: data.files?.length || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      uploadTimestamp: data.uploadTimestamp,
      files: (data.files || []).map(f => this.mapToDocumentFile(f)),
      userId: data.userId,
    };
  }

  /**
   * Map API file to DocumentFile
   */
  private mapToDocumentFile(data: any): DocumentFile {
    return {
      documentId: data.documentId,
      originalFileName: data.originalFileName || data.fileName || 'Unknown',
      fileUrl: data.fileUrl || '',
      fileSize: data.fileSize || 0,
      status: data.status || 'pending',
      mimeType: data.mimeType,
      ocrProcessed: data.ocrProcessed || false,
      extractedText: data.extractedText,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
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

