import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { catchError, of, tap, finalize } from 'rxjs';
import { OcrApiService } from './ocr-api.service';
import {
  OcrJob,
  OcrStatus,
  OcrStats,
  OcrFilterOptions,
  OcrData,
  SUPPORTED_LANGUAGES,
} from '../models/ocr.model';

@Injectable({
  providedIn: 'root'
})
export class OcrStateService {
  private readonly api = inject(OcrApiService);

  // ==================== State Signals ====================

  private readonly _jobs = signal<OcrJob[]>([]);
  private readonly _selectedJob = signal<OcrJob | null>(null);
  private readonly _stats = signal<OcrStats | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _uploadProgress = signal(0);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _filter = signal<OcrFilterOptions>({});

  // ==================== Public Readonly Signals ====================

  readonly jobs = this._jobs.asReadonly();
  readonly selectedJob = this._selectedJob.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly uploadProgress = this._uploadProgress.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly filter = this._filter.asReadonly();

  // ==================== Computed Properties ====================

  readonly filteredJobs = computed(() => {
    let jobs = this._jobs();
    const currentFilter = this._filter();

    if (currentFilter.status) {
      jobs = jobs.filter(job => job.status === currentFilter.status);
    }

    if (currentFilter.searchQuery) {
      const query = currentFilter.searchQuery.toLowerCase();
      jobs = jobs.filter(job =>
        job.fileName.toLowerCase().includes(query) ||
        job.extractedText?.toLowerCase().includes(query)
      );
    }

    return jobs;
  });

  readonly processingJobs = computed(() =>
    this._jobs().filter(job => job.status === 'PROCESSING')
  );

  readonly pendingJobs = computed(() =>
    this._jobs().filter(job => job.status === 'PENDING')
  );

  readonly completedJobs = computed(() =>
    this._jobs().filter(job => job.status === 'COMPLETED')
  );

  readonly failedJobs = computed(() =>
    this._jobs().filter(job => job.status === 'FAILED')
  );

  readonly totalJobs = computed(() => this._jobs().length);

  readonly hasJobs = computed(() => this._jobs().length > 0);

  readonly averageConfidence = computed(() => {
    const completed = this.completedJobs();
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, job) => sum + (job.confidence || 0), 0);
    return Math.round((total / completed.length) * 100);
  });

  // ==================== Actions ====================

  /**
   * Load OCR jobs (mock data for now until API endpoint exists)
   */
  loadJobs(): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Simulate loading - replace with actual API call when available
    setTimeout(() => {
      this.loadMockJobs();
      this.loadMockStats();
      this._isLoading.set(false);
    }, 800);
  }

  /**
   * Extract text from a document
   */
  extractText(collectionId: string, documentId: string, fileName: string): void {
    // Add to processing queue
    const job: OcrJob = {
      id: `ocr-${Date.now()}`,
      collectionId,
      documentId,
      fileName,
      status: 'PROCESSING',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    this._jobs.update(jobs => [job, ...jobs]);
    this._isProcessing.set(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      this._jobs.update(jobs =>
        jobs.map(j =>
          j.id === job.id && j.status === 'PROCESSING'
            ? { ...j, progress: Math.min(j.progress + 10, 90) }
            : j
        )
      );
    }, 500);

    this.api.extractText(collectionId, documentId).pipe(
      tap(result => {
        clearInterval(progressInterval);
        this._jobs.update(jobs =>
          jobs.map(j =>
            j.id === job.id
              ? {
                  ...j,
                  status: 'COMPLETED' as OcrStatus,
                  progress: 100,
                  extractedText: result.extractedText,
                  confidence: result.confidence,
                  language: result.language,
                  completedAt: new Date().toISOString()
                }
              : j
          )
        );
        this._successMessage.set(`Text extracted from "${fileName}" successfully!`);
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        clearInterval(progressInterval);
        this._jobs.update(jobs =>
          jobs.map(j =>
            j.id === job.id
              ? { ...j, status: 'FAILED' as OcrStatus, error: 'Extraction failed' }
              : j
          )
        );
        this._error.set(`Failed to extract text from "${fileName}"`);
        console.error('OCR extraction error:', error);
        return of(null);
      }),
      finalize(() => {
        this._isProcessing.set(
          this._jobs().some(j => j.status === 'PROCESSING')
        );
      })
    ).subscribe();
  }

  /**
   * Upload and extract text from files
   */
  uploadAndExtract(files: File[]): void {
    if (files.length === 0) return;

    this._isProcessing.set(true);
    this._uploadProgress.set(0);
    this._error.set(null);

    // Add jobs for each file
    const newJobs: OcrJob[] = files.map((file, index) => ({
      id: `ocr-${Date.now()}-${index}`,
      collectionId: '',
      documentId: '',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      status: 'PENDING' as OcrStatus,
      progress: 0,
      createdAt: new Date().toISOString()
    }));

    this._jobs.update(jobs => [...newJobs, ...jobs]);

    this.api.uploadAndExtractAll(files).pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this._uploadProgress.set(progress);

          // Update job progress
          this._jobs.update(jobs =>
            jobs.map(j =>
              newJobs.some(nj => nj.id === j.id)
                ? { ...j, progress: Math.min(progress, 50), status: 'PROCESSING' as OcrStatus }
                : j
            )
          );
        } else if (event.type === HttpEventType.Response) {
          // Mark as completed
          this._jobs.update(jobs =>
            jobs.map(j =>
              newJobs.some(nj => nj.id === j.id)
                ? { ...j, progress: 100, status: 'COMPLETED' as OcrStatus, completedAt: new Date().toISOString() }
                : j
            )
          );
          this._successMessage.set(`${files.length} files processed successfully!`);
          setTimeout(() => this._successMessage.set(null), 3000);
        }
      }),
      catchError(error => {
        this._jobs.update(jobs =>
          jobs.map(j =>
            newJobs.some(nj => nj.id === j.id)
              ? { ...j, status: 'FAILED' as OcrStatus, error: 'Processing failed' }
              : j
          )
        );
        this._error.set('Failed to process files');
        console.error('Upload and extract error:', error);
        return of(null);
      }),
      finalize(() => {
        this._isProcessing.set(false);
        this._uploadProgress.set(0);
      })
    ).subscribe();
  }

  /**
   * Load OCR data for a job
   */
  loadOcrData(job: OcrJob): void {
    if (!job.collectionId || !job.documentId) return;

    this._isLoading.set(true);

    this.api.getOcrData(job.collectionId, job.documentId).pipe(
      tap(data => {
        this._jobs.update(jobs =>
          jobs.map(j =>
            j.id === job.id
              ? { ...j, extractedText: data.extractedText, confidence: data.confidence }
              : j
          )
        );
        this._selectedJob.set({
          ...job,
          extractedText: data.extractedText,
          confidence: data.confidence
        });
      }),
      catchError(error => {
        this._error.set('Failed to load OCR data');
        console.error('Load OCR data error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Retry failed job
   */
  retryJob(job: OcrJob): void {
    if (job.collectionId && job.documentId) {
      this._jobs.update(jobs =>
        jobs.map(j =>
          j.id === job.id
            ? { ...j, status: 'PENDING' as OcrStatus, error: undefined, progress: 0 }
            : j
        )
      );
      this.extractText(job.collectionId, job.documentId, job.fileName);
    }
  }

  /**
   * Remove job from list
   */
  removeJob(jobId: string): void {
    this._jobs.update(jobs => jobs.filter(j => j.id !== jobId));
    if (this._selectedJob()?.id === jobId) {
      this._selectedJob.set(null);
    }
  }

  /**
   * Clear all completed jobs
   */
  clearCompleted(): void {
    this._jobs.update(jobs => jobs.filter(j => j.status !== 'COMPLETED'));
  }

  /**
   * Clear all failed jobs
   */
  clearFailed(): void {
    this._jobs.update(jobs => jobs.filter(j => j.status !== 'FAILED'));
  }

  /**
   * Select a job for viewing
   */
  selectJob(job: OcrJob | null): void {
    this._selectedJob.set(job);
  }

  /**
   * Download extracted text
   */
  downloadText(job: OcrJob): void {
    if (!job.extractedText) return;
    const fileName = job.fileName.replace(/\.[^/.]+$/, '');
    this.api.downloadAsText(job.extractedText, fileName);
  }

  /**
   * Download as Word document
   */
  downloadDocx(job: OcrJob): void {
    if (!job.collectionId || !job.documentId) return;

    this.api.downloadAsDocx(job.collectionId, job.documentId).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = job.fileName.replace(/\.[^/.]+$/, '') + '.docx';
        link.click();
        window.URL.revokeObjectURL(url);
      }),
      catchError(error => {
        this._error.set('Failed to download file');
        console.error('Download error:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Download as JSON
   */
  downloadJson(job: OcrJob): void {
    if (!job.extractedText) return;
    const data: OcrData = {
      documentId: job.documentId,
      fileName: job.fileName,
      extractedText: job.extractedText,
      confidence: job.confidence || 0
    };
    const fileName = job.fileName.replace(/\.[^/.]+$/, '');
    this.api.downloadAsJson(data, fileName);
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this._successMessage.set('Text copied to clipboard!');
      setTimeout(() => this._successMessage.set(null), 2000);
      return true;
    } catch {
      this._error.set('Failed to copy to clipboard');
      return false;
    }
  }

  // ==================== Filter Actions ====================

  setFilter(filter: OcrFilterOptions): void {
    this._filter.set(filter);
  }

  updateFilter(partialFilter: Partial<OcrFilterOptions>): void {
    this._filter.update(current => ({ ...current, ...partialFilter }));
  }

  clearFilter(): void {
    this._filter.set({});
  }

  // ==================== Utility ====================

  clearError(): void {
    this._error.set(null);
  }

  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  getLanguageName(code: string): string {
    return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES['unknown'];
  }

  // ==================== Mock Data ====================

  private loadMockJobs(): void {
    const mockJobs: OcrJob[] = [
      {
        id: 'ocr-1',
        collectionId: 'col-1',
        documentId: 'doc-1',
        fileName: 'invoice-2024-001.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        status: 'COMPLETED',
        progress: 100,
        extractedText: 'INVOICE\n\nInvoice Number: INV-2024-001\nDate: December 15, 2024\n\nBill To:\nAcme Corporation\n123 Business Street\nNew York, NY 10001\n\nDescription: Professional Services\nAmount: $5,000.00\n\nSubtotal: $5,000.00\nTax (10%): $500.00\nTotal: $5,500.00\n\nPayment Terms: Net 30\nDue Date: January 14, 2025',
        confidence: 0.96,
        language: 'en',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3500000).toISOString()
      },
      {
        id: 'ocr-2',
        collectionId: 'col-1',
        documentId: 'doc-2',
        fileName: 'contract-agreement.pdf',
        fileSize: 890000,
        mimeType: 'application/pdf',
        status: 'COMPLETED',
        progress: 100,
        extractedText: 'SERVICE AGREEMENT\n\nThis Agreement is entered into as of December 1, 2024, by and between:\n\nParty A: UnravelDocs Inc.\nParty B: Client Company LLC\n\n1. SERVICES\nThe Service Provider agrees to provide document processing and OCR services as specified in Exhibit A.\n\n2. TERM\nThis Agreement shall commence on the Effective Date and continue for a period of twelve (12) months.\n\n3. COMPENSATION\nClient shall pay Service Provider according to the pricing schedule in Exhibit B.',
        confidence: 0.94,
        language: 'en',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 7100000).toISOString()
      },
      {
        id: 'ocr-3',
        collectionId: 'col-2',
        documentId: 'doc-3',
        fileName: 'receipt-scan.jpg',
        fileSize: 156000,
        mimeType: 'image/jpeg',
        status: 'PROCESSING',
        progress: 65,
        createdAt: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'ocr-4',
        collectionId: 'col-2',
        documentId: 'doc-4',
        fileName: 'handwritten-notes.png',
        fileSize: 320000,
        mimeType: 'image/png',
        status: 'FAILED',
        progress: 0,
        error: 'Unable to extract text: Image quality too low',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'ocr-5',
        collectionId: 'col-3',
        documentId: 'doc-5',
        fileName: 'report-q4-2024.pdf',
        fileSize: 1250000,
        mimeType: 'application/pdf',
        status: 'PENDING',
        progress: 0,
        createdAt: new Date().toISOString()
      }
    ];

    this._jobs.set(mockJobs);
  }

  private loadMockStats(): void {
    this._stats.set({
      totalProcessed: 156,
      totalPending: 3,
      totalFailed: 2,
      averageConfidence: 94,
      pagesProcessedToday: 23,
      pagesRemaining: 477,
      monthlyLimit: 500
    });
  }
}

