import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap, finalize } from 'rxjs';
import { AiApiService } from './ai-api.service';
import {
  SummarizeRequest,
  SummarizeResponse,
  ClassifyResponse,
  SummaryType,
  ModelPreference,
} from '../models/ai.model';

@Injectable({
  providedIn: 'root',
})
export class AiStateService {
  private readonly api = inject(AiApiService);

  // ==================== Summarization State ====================

  private readonly _isSummarizing = signal(false);
  private readonly _summaryResult = signal<SummarizeResponse | null>(null);
  private readonly _summaryError = signal<string | null>(null);

  readonly isSummarizing = this._isSummarizing.asReadonly();
  readonly summaryResult = this._summaryResult.asReadonly();
  readonly summaryError = this._summaryError.asReadonly();

  // ==================== Classification State ====================

  private readonly _isClassifying = signal(false);
  private readonly _classifyResult = signal<ClassifyResponse | null>(null);
  private readonly _classifyError = signal<string | null>(null);

  readonly isClassifying = this._isClassifying.asReadonly();
  readonly classifyResult = this._classifyResult.asReadonly();
  readonly classifyError = this._classifyError.asReadonly();

  // ==================== General State ====================

  private readonly _successMessage = signal<string | null>(null);
  readonly successMessage = this._successMessage.asReadonly();

  // ==================== Actions ====================

  /**
   * Summarize document text
   */
  summarize(
    documentId: string,
    summaryType: SummaryType = 'SHORT',
    modelPreference?: ModelPreference
  ): void {
    this._isSummarizing.set(true);
    this._summaryError.set(null);
    this._summaryResult.set(null);

    const request: SummarizeRequest = {
      documentId,
      summaryType,
      modelPreference,
    };

    this.api
      .summarize(request)
      .pipe(
        tap((result) => {
          this._summaryResult.set(result);
          this._successMessage.set('Document summarized successfully!');
          setTimeout(() => this._successMessage.set(null), 3000);
        }),
        catchError((error) => {
          const message =
            error?.error?.message || 'Failed to summarize document';
          this._summaryError.set(message);
          console.error('Summarization error:', error);
          return of(null);
        }),
        finalize(() => this._isSummarizing.set(false))
      )
      .subscribe();
  }

  /**
   * Classify document type and generate tags
   */
  classify(documentId: string): void {
    this._isClassifying.set(true);
    this._classifyError.set(null);
    this._classifyResult.set(null);

    this.api
      .classify(documentId)
      .pipe(
        tap((result) => {
          this._classifyResult.set(result);
          this._successMessage.set('Document classified successfully!');
          setTimeout(() => this._successMessage.set(null), 3000);
        }),
        catchError((error) => {
          const message =
            error?.error?.message || 'Failed to classify document';
          this._classifyError.set(message);
          console.error('Classification error:', error);
          return of(null);
        }),
        finalize(() => this._isClassifying.set(false))
      )
      .subscribe();
  }

  // ==================== Reset ====================

  clearSummaryResult(): void {
    this._summaryResult.set(null);
    this._summaryError.set(null);
  }

  clearClassifyResult(): void {
    this._classifyResult.set(null);
    this._classifyError.set(null);
  }

  clearAll(): void {
    this.clearSummaryResult();
    this.clearClassifyResult();
    this._successMessage.set(null);
  }

  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }
}

