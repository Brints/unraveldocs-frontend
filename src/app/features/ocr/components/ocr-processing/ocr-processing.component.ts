import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OcrStateService } from '../../services/ocr-state.service';
import { OcrJob, OcrStatus, SUPPORTED_LANGUAGES } from '../../models/ocr.model';

@Component({
  selector: 'app-ocr-processing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ocr-processing.component.html',
  styleUrls: ['./ocr-processing.component.css']
})
export class OcrProcessingComponent implements OnInit {
  protected readonly ocrState = inject(OcrStateService);

  // Local state
  isDragOver = signal(false);
  activeTab = signal<'all' | 'processing' | 'completed' | 'failed'>('all');
  showUploadModal = signal(false);
  selectedFiles = signal<File[]>([]);
  showResultModal = signal(false);

  // From state service
  readonly jobs = this.ocrState.jobs;
  readonly filteredJobs = this.ocrState.filteredJobs;
  readonly selectedJob = this.ocrState.selectedJob;
  readonly stats = this.ocrState.stats;
  readonly isLoading = this.ocrState.isLoading;
  readonly isProcessing = this.ocrState.isProcessing;
  readonly uploadProgress = this.ocrState.uploadProgress;
  readonly error = this.ocrState.error;
  readonly successMessage = this.ocrState.successMessage;
  readonly processingJobs = this.ocrState.processingJobs;
  readonly completedJobs = this.ocrState.completedJobs;
  readonly failedJobs = this.ocrState.failedJobs;
  readonly pendingJobs = this.ocrState.pendingJobs;

  // Pagination
  readonly paginatedJobs = this.ocrState.paginatedJobs;
  readonly currentPage = this.ocrState.currentPage;
  readonly totalPages = this.ocrState.totalPages;
  readonly pageNumbers = this.ocrState.pageNumbers;
  readonly hasPreviousPage = this.ocrState.hasPreviousPage;
  readonly hasNextPage = this.ocrState.hasNextPage;

  ngOnInit(): void {
    this.ocrState.loadJobs();
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private handleFiles(files: File[]): void {
    const validFiles = files.filter(file =>
      file.type === 'application/pdf' ||
      file.type.startsWith('image/') ||
      file.type.includes('word')
    );

    if (validFiles.length > 0) {
      this.selectedFiles.set(validFiles);
      this.showUploadModal.set(true);
    }
  }

  processFiles(): void {
    const files = this.selectedFiles();
    if (files.length > 0) {
      this.ocrState.uploadAndExtract(files);
      this.closeUploadModal();
    }
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.selectedFiles.set([]);
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  // Tab management
  setActiveTab(tab: 'all' | 'processing' | 'completed' | 'failed'): void {
    this.activeTab.set(tab);
    this.ocrState.resetPagination(); // Reset to page 1 when switching tabs

    if (tab === 'all') {
      this.ocrState.clearFilter();
    } else {
      const statusMap: Record<string, OcrStatus> = {
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
      };
      this.ocrState.updateFilter({ status: statusMap[tab] });
    }
  }

  getTabJobs(): OcrJob[] {
    // Use paginated jobs for display
    return this.paginatedJobs();
  }

  // Pagination methods
  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      this.ocrState.setPage(page);
    }
  }

  nextPage(): void {
    this.ocrState.nextPage();
  }

  previousPage(): void {
    this.ocrState.previousPage();
  }

  getStartIndex(): number {
    return (this.currentPage() - 1) * 5 + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * 5, this.filteredJobs().length);
  }

  // Job actions
  viewResult(job: OcrJob): void {
    this.ocrState.selectJob(job);
    this.showResultModal.set(true);
  }

  closeResultModal(): void {
    this.showResultModal.set(false);
    this.ocrState.selectJob(null);
  }

  retryJob(job: OcrJob): void {
    this.ocrState.retryJob(job);
  }

  removeJob(job: OcrJob): void {
    this.ocrState.removeJob(job.id);
  }

  downloadText(job: OcrJob): void {
    this.ocrState.downloadText(job);
  }

  downloadDocx(job: OcrJob): void {
    this.ocrState.downloadDocx(job);
  }

  downloadJson(job: OcrJob): void {
    this.ocrState.downloadJson(job);
  }

  copyText(text: string): void {
    this.ocrState.copyToClipboard(text);
  }

  clearCompleted(): void {
    this.ocrState.clearCompleted();
  }

  clearFailed(): void {
    this.ocrState.clearFailed();
  }

  // Helpers
  formatFileSize(bytes?: number): string {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString?: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return this.formatDate(dateString);
  }

  getStatusIcon(status: OcrStatus): string {
    const s = status.toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'PROCESSING':
        return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
      case 'FAILED':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'PENDING':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getStatusColor(status: OcrStatus): string {
    const s = status.toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'PENDING':
        return 'text-amber-600 bg-amber-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusLabel(status: OcrStatus): string {
    const s = status.toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'Completed';
      case 'PROCESSING':
        return 'Processing';
      case 'FAILED':
        return 'Failed';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  }

  isProcessingStatus(status: OcrStatus): boolean {
    const s = status.toUpperCase();
    return s === 'PROCESSING' || s === 'PENDING';
  }

  isCompletedStatus(status: OcrStatus): boolean {
    const s = status.toUpperCase();
    return s === 'COMPLETED' || s === 'SUCCESS';
  }

  isFailedStatus(status: OcrStatus): boolean {
    return status.toUpperCase() === 'FAILED';
  }

  getConfidenceColor(confidence?: number): string {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-amber-600';
    return 'text-red-600';
  }

  formatConfidence(confidence?: number): string {
    if (!confidence) return '—';
    return `${Math.round(confidence * 100)}%`;
  }

  getLanguageName(code?: string): string {
    if (!code) return 'Unknown';
    return SUPPORTED_LANGUAGES[code] || code.toUpperCase();
  }

  getFileIcon(mimeType?: string): string {
    if (!mimeType) return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    if (mimeType === 'application/pdf') return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    if (mimeType.startsWith('image/')) return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }

  getUsagePercentage(): number {
    const s = this.stats();
    if (!s) return 0;
    return Math.round(((s.monthlyLimit - s.pagesRemaining) / s.monthlyLimit) * 100);
  }
}

