import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OcrApiResponse,
  OcrExtractionResult,
  OcrCollectionResults,
  OcrData,
} from '../models/ocr.model';

@Injectable({
  providedIn: 'root'
})
export class OcrApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== OCR Extraction ====================

  /**
   * Extract text from a specific document
   * POST /collections/{collectionId}/document/{documentId}/extract
   */
  extractText(collectionId: string, documentId: string): Observable<OcrExtractionResult> {
    return this.http.post<OcrApiResponse<OcrExtractionResult>>(
      `${this.apiUrl}/collections/${collectionId}/document/${documentId}/extract`,
      {}
    ).pipe(map(response => response.data));
  }

  /**
   * Upload files and extract text from all
   * POST /collections/upload/extract-all
   */
  uploadAndExtractAll(files: File[]): Observable<HttpEvent<OcrApiResponse<{ collectionId: string; files: unknown[] }>>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const req = new HttpRequest('POST', `${this.apiUrl}/collections/upload/extract-all`, formData, {
      reportProgress: true
    });

    return this.http.request<OcrApiResponse<{ collectionId: string; files: unknown[] }>>(req);
  }

  // ==================== OCR Results ====================

  /**
   * Get OCR results for a collection
   * GET /collections/{collectionId}/document/results
   */
  getOcrResults(collectionId: string): Observable<OcrCollectionResults> {
    return this.http.get<OcrApiResponse<OcrCollectionResults>>(
      `${this.apiUrl}/collections/${collectionId}/document/results`
    ).pipe(map(response => response.data));
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

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

