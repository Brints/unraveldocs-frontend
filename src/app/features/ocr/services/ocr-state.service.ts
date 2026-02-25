import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { OcrApiService } from './ocr-api.service';
import { UserApiService } from '../../user/services/user-api.service';
import {
  OcrJob,
  OcrStatus,
  OcrStats,
  OcrFilterOptions,
  OcrData,
  SUPPORTED_LANGUAGES,
  UploadExtractResponse,
  PageSelectionOptions,
  ContentFormat,
  UpdateOcrContentRequest,
} from '../models/ocr.model';

@Injectable({
  providedIn: 'root'
})
export class OcrStateService {
  private readonly api = inject(OcrApiService);
  private readonly userApi = inject(UserApiService);

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

  // Pagination state
  private readonly _currentPage = signal(1);
  private readonly _pageSize = signal(10); // Default 10 per page

  // Page size options
  static readonly PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

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
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  // ==================== Computed Properties ====================

  readonly filteredJobs = computed(() => {
    let jobs = this._jobs();
    const currentFilter = this._filter();

    if (currentFilter.status) {
      const filterStatus = currentFilter.status.toUpperCase();
      // When filtering by PROCESSING, also include PENDING jobs
      if (filterStatus === 'PROCESSING') {
        jobs = jobs.filter(job => {
          const jobStatus = job.status.toUpperCase();
          return jobStatus === 'PROCESSING' || jobStatus === 'PENDING';
        });
      } else {
        jobs = jobs.filter(job => job.status.toUpperCase() === filterStatus);
      }
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
    this._jobs().filter(job => job.status.toUpperCase() === 'PROCESSING')
  );

  readonly pendingJobs = computed(() =>
    this._jobs().filter(job => job.status.toUpperCase() === 'PENDING')
  );

  readonly completedJobs = computed(() =>
    this._jobs().filter(job => job.status.toUpperCase() === 'COMPLETED')
  );

  readonly failedJobs = computed(() =>
    this._jobs().filter(job => job.status.toUpperCase() === 'FAILED')
  );

  readonly totalJobs = computed(() => this._jobs().length);

  readonly hasJobs = computed(() => this._jobs().length > 0);

  readonly averageConfidence = computed(() => {
    const completed = this.completedJobs();
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, job) => sum + (job.confidence || 0), 0);
    return Math.round((total / completed.length) * 100);
  });

  // Pagination computed properties
  readonly totalPages = computed(() => {
    const totalJobs = this.filteredJobs().length;
    return Math.ceil(totalJobs / this._pageSize()) || 1;
  });

  readonly paginatedJobs = computed(() => {
    const jobs = this.filteredJobs();
    const page = this._currentPage();
    const size = this._pageSize();
    const start = (page - 1) * size;
    return jobs.slice(start, start + size);
  });

  readonly hasPreviousPage = computed(() => this._currentPage() > 1);
  readonly hasNextPage = computed(() => this._currentPage() < this.totalPages());

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this._currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (current < total - 2) {
        pages.push('...');
      }

      if (!pages.includes(total)) {
        pages.push(total);
      }
    }

    return pages;
  });

  // ==================== Actions ====================

  /**
   * Load OCR jobs from all collections
   */
  loadJobs(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._jobs.set([]);

    // Fetch all collections with OCR results and storage info in parallel
    forkJoin({
      jobs: this.api.getAllCollectionsWithOcrResults().pipe(catchError(() => of([]))),
      storage: this.userApi.getStorageInfo().pipe(catchError(() => of(null)))
    }).pipe(
      tap(({ jobs, storage }) => {
        this._jobs.set(jobs);
        this.calculateStats(storage);
      }),
      catchError(error => {
        console.error('Failed to load OCR jobs:', error);
        this._error.set('Failed to load OCR history');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Calculate stats from current jobs and storage info
   */
  private calculateStats(storageInfo?: { ocrPageLimit: number; ocrPagesUsed: number; ocrPagesRemaining: number; ocrUnlimited: boolean } | null): void {
    const jobs = this._jobs();
    const completed = jobs.filter(j => j.status.toUpperCase() === 'COMPLETED');
    const failed = jobs.filter(j => j.status.toUpperCase() === 'FAILED');
    const pending = jobs.filter(j =>
      j.status.toUpperCase() === 'PENDING' || j.status.toUpperCase() === 'PROCESSING'
    );

    // Calculate today's processed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const processedToday = completed.filter(j => {
      const jobDate = new Date(j.completedAt || j.createdAt);
      return jobDate >= today;
    }).length;

    const avgConfidence = completed.length > 0
      ? Math.round(completed.reduce((sum, j) => sum + (j.confidence || 0.9), 0) / completed.length * 100)
      : 0;

    // Use storage info from API if available, otherwise use defaults
    const monthlyLimit = storageInfo?.ocrUnlimited ? -1 : (storageInfo?.ocrPageLimit ?? 500);
    const pagesRemaining = storageInfo?.ocrUnlimited ? -1 : (storageInfo?.ocrPagesRemaining ?? 500);

    this._stats.set({
      totalProcessed: completed.length,
      totalPending: pending.length,
      totalFailed: failed.length,
      averageConfidence: avgConfidence,
      pagesProcessedToday: processedToday,
      pagesRemaining: pagesRemaining,
      monthlyLimit: monthlyLimit
    });
  }

  /**
   * Extract text from a document
   */
  extractText(
    collectionId: string,
    documentId: string,
    fileName: string,
    pageOptions?: PageSelectionOptions
  ): void {
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

    this.api.extractText(collectionId, documentId, pageOptions).pipe(
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
                  error: result.errorMessage || undefined,
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

    // Add jobs for each file with pending status
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

          // Update job progress during upload
          this._jobs.update(jobs =>
            jobs.map(j =>
              newJobs.some(nj => nj.id === j.id)
                ? { ...j, progress: Math.min(progress, 50), status: 'PROCESSING' as OcrStatus }
                : j
            )
          );
        } else if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<any>;
          const data = response.body?.data as UploadExtractResponse;

          if (data && data.collectionId) {
            // Update jobs with collection and document IDs
            this._jobs.update(jobs =>
              jobs.map(j => {
                if (newJobs.some(nj => nj.id === j.id)) {
                  const fileData = data.files?.find(f => f.originalFileName === j.fileName);
                  if (fileData) {
                    return {
                      ...j,
                      collectionId: data.collectionId,
                      documentId: fileData.documentId,
                      fileUrl: fileData.fileUrl,
                      progress: 75,
                      status: (data.overallStatus === 'processing' ? 'PROCESSING' : 'COMPLETED') as OcrStatus
                    };
                  }
                }
                return j;
              })
            );

            // Start polling for OCR results
            this.pollOcrResults(data.collectionId, newJobs.map(j => j.id));
          }

          this._successMessage.set(`${files.length} file(s) uploaded and queued for processing!`);
          setTimeout(() => this._successMessage.set(null), 3000);
        }
      }),
      catchError(error => {
        this._jobs.update(jobs =>
          jobs.map(j =>
            newJobs.some(nj => nj.id === j.id)
              ? { ...j, status: 'FAILED' as OcrStatus, error: error.error?.message || 'Processing failed' }
              : j
          )
        );
        this._error.set('Failed to process files');
        console.error('Upload and extract error:', error);
        return of(null);
      }),
      finalize(() => {
        this._uploadProgress.set(0);
      })
    ).subscribe();
  }

  /**
   * Poll for OCR results until processing is complete
   */
  private pollOcrResults(collectionId: string, jobIds: string[]): void {
    const pollInterval = 3000; // 3 seconds
    const maxAttempts = 20; // Max 1 minute of polling
    let attempts = 0;

    const poll = () => {
      attempts++;

      this.api.getOcrResults(collectionId).pipe(
        tap(results => {
          // Update jobs with OCR results
          this._jobs.update(jobs =>
            jobs.map(j => {
              if (jobIds.includes(j.id) && j.collectionId === collectionId) {
                const fileResult = results.files?.find(f => f.documentId === j.documentId);
                if (fileResult) {
                  const status = this.mapStatus(fileResult.status);
                  return {
                    ...j,
                    status,
                    progress: status === 'COMPLETED' || status === 'FAILED' ? 100 : j.progress,
                    extractedText: fileResult.extractedText || undefined,
                    error: fileResult.errorMessage || undefined,
                    completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date().toISOString() : undefined
                  };
                }
              }
              return j;
            })
          );

          // Check if all jobs are complete
          const allComplete = results.overallStatus === 'processed' ||
                              results.overallStatus === 'failed_ocr' ||
                              results.overallStatus === 'completed';

          if (!allComplete && attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            this._isProcessing.set(false);
            this.updateStatsFromJobs();
          }
        }),
        catchError(error => {
          console.error('Poll OCR results error:', error);
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            this._isProcessing.set(false);
          }
          return of(null);
        })
      ).subscribe();
    };

    // Start polling after a short delay
    setTimeout(poll, 2000);
  }

  /**
   * Map API status to OcrStatus
   */
  private mapStatus(status: string): OcrStatus {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
      case 'COMPLETED':
        return 'COMPLETED';
      case 'PROCESSING':
        return 'PROCESSING';
      case 'FAILED':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Update stats based on current jobs
   */
  private updateStatsFromJobs(): void {
    const jobs = this._jobs();
    const completed = jobs.filter(j => j.status.toUpperCase() === 'COMPLETED');
    const failed = jobs.filter(j => j.status.toUpperCase() === 'FAILED');
    const pending = jobs.filter(j => j.status.toUpperCase() === 'PENDING' || j.status.toUpperCase() === 'PROCESSING');

    const avgConfidence = completed.length > 0
      ? Math.round(completed.reduce((sum, j) => sum + (j.confidence || 0.9), 0) / completed.length * 100)
      : 0;

    this._stats.update(current => {
      // For unlimited plans, pagesRemaining is -1
      const isUnlimited = current?.pagesRemaining === -1 || current?.monthlyLimit === -1;
      const pagesRemaining = isUnlimited ? -1 : Math.max(0, (current?.pagesRemaining ?? 500) - completed.length);

      return {
        totalProcessed: (current?.totalProcessed || 0) + completed.length,
        totalPending: pending.length,
        totalFailed: failed.length,
        averageConfidence: avgConfidence || current?.averageConfidence || 0,
        pagesProcessedToday: (current?.pagesProcessedToday || 0) + completed.length,
        pagesRemaining: pagesRemaining,
        monthlyLimit: current?.monthlyLimit ?? 500
      };
    });
  }

  /**
   * Get OCR data as Observable (for direct subscription)
   */
  getOcrDataObservable(collectionId: string, documentId: string): Observable<OcrData> {
    return this.api.getOcrData(collectionId, documentId);
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
              ? {
                  ...j,
                  extractedText: data.extractedText,
                  editedContent: data.editedContent || undefined,
                  contentFormat: data.contentFormat || undefined,
                  editedBy: data.editedBy || undefined,
                  editedAt: data.editedAt || undefined,
                  aiSummary: data.aiSummary || undefined,
                  documentType: data.documentType || undefined,
                  aiTags: data.aiTags || undefined,
                }
              : j
          )
        );
        this._selectedJob.set({
          ...job,
          extractedText: data.extractedText,
          editedContent: data.editedContent || undefined,
          contentFormat: data.contentFormat || undefined,
          editedBy: data.editedBy || undefined,
          editedAt: data.editedAt || undefined,
          aiSummary: data.aiSummary || undefined,
          documentType: data.documentType || undefined,
          aiTags: data.aiTags || undefined,
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
   * Update edited content for a document
   */
  updateContent(
    collectionId: string,
    documentId: string,
    editedContent: string,
    contentFormat: ContentFormat
  ): void {
    this._isProcessing.set(true);
    this._error.set(null);

    const request: UpdateOcrContentRequest = { editedContent, contentFormat };

    this.api.updateContent(collectionId, documentId, request).pipe(
      tap(result => {
        // Update the job in local state
        this._jobs.update(jobs =>
          jobs.map(j =>
            j.documentId === documentId
              ? {
                  ...j,
                  editedContent: result.editedContent || undefined,
                  contentFormat: result.contentFormat || undefined,
                  editedBy: result.editedBy || undefined,
                  editedAt: result.editedAt || undefined,
                }
              : j
          )
        );
        // Update selected job if it's the same
        const selected = this._selectedJob();
        if (selected && selected.documentId === documentId) {
          this._selectedJob.set({
            ...selected,
            editedContent: result.editedContent || undefined,
            contentFormat: result.contentFormat || undefined,
            editedBy: result.editedBy || undefined,
            editedAt: result.editedAt || undefined,
          });
        }
        this._successMessage.set('Content saved successfully!');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        const message = error?.error?.message || 'Failed to save content';
        this._error.set(message);
        console.error('Update content error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
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
   * Remove job from list and delete from backend
   */
  removeJob(jobId: string): void {
    const job = this._jobs().find(j => j.id === jobId);
    if (!job) return;

    // Optimistically remove from local state
    this._jobs.update(jobs => jobs.filter(j => j.id !== jobId));
    if (this._selectedJob()?.id === jobId) {
      this._selectedJob.set(null);
    }

    // If we have collection and document IDs, delete from backend
    if (job.collectionId && job.documentId) {
      this.api.deleteDocument(job.collectionId, job.documentId).pipe(
        tap(() => {
          this._successMessage.set(`"${job.fileName}" deleted successfully`);
          setTimeout(() => this._successMessage.set(null), 3000);
        }),
        catchError(error => {
          console.error('Failed to delete document:', error);
          // Restore the job if delete failed
          this._jobs.update(jobs => [job, ...jobs]);
          this._error.set(`Failed to delete "${job.fileName}"`);
          return of(null);
        })
      ).subscribe();
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
      originalFileName: job.fileName,
      status: job.status,
      extractedText: job.extractedText,
      editedContent: job.editedContent || null,
      contentFormat: job.contentFormat || null,
      editedBy: job.editedBy || null,
      editedAt: job.editedAt || null,
      errorMessage: job.error || null,
      aiSummary: job.aiSummary || null,
      documentType: job.documentType || null,
      aiTags: job.aiTags || null,
      createdAt: job.createdAt,
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
    this._currentPage.set(1); // Reset to first page when filter is cleared
  }

  // ==================== Pagination Actions ====================

  setPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this._currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this._currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this._currentPage.update(p => p - 1);
    }
  }

  setPageSize(size: number): void {
    this._pageSize.set(size);
    this._currentPage.set(1); // Reset to first page when page size changes
  }

  resetPagination(): void {
    this._currentPage.set(1);
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
}

