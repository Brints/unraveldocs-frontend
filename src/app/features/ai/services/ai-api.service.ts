import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AiApiResponse,
  SummarizeRequest,
  SummarizeResponse,
  ClassifyResponse,
} from '../models/ai.model';

@Injectable({
  providedIn: 'root',
})
export class AiApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Summarize document text
   * POST /ai/summarize
   */
  summarize(request: SummarizeRequest): Observable<SummarizeResponse> {
    return this.http
      .post<AiApiResponse<SummarizeResponse>>(`${this.apiUrl}/ai/summarize`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Classify document type and generate tags
   * POST /ai/classify/{documentId}
   */
  classify(documentId: string): Observable<ClassifyResponse> {
    return this.http
      .post<AiApiResponse<ClassifyResponse>>(`${this.apiUrl}/ai/classify/${documentId}`, {})
      .pipe(map((response) => response.data));
  }
}

