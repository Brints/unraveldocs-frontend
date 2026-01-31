import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchStateService } from '../../services/search-state.service';
import { SearchResult, SORT_OPTIONS, PAGE_SIZE_OPTIONS } from '../../models/search.model';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DocumentViewerComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  protected readonly searchState = inject(SearchStateService);

  // Local state
  searchQuery = signal('');
  showFilters = signal(false);
  selectedResult = signal<SearchResult | null>(null);
  showPreviewModal = signal(false);
  showDocumentViewerModal = signal(false);
  documentViewerUrl = signal<string | null>(null);
  documentViewerFileName = signal<string | null>(null);

  // From state service
  readonly results = this.searchState.results;
  readonly totalHits = this.searchState.totalHits;
  readonly isLoading = this.searchState.isLoading;
  readonly error = this.searchState.error;
  readonly hasSearched = this.searchState.hasSearched;
  readonly hasResults = this.searchState.hasResults;
  readonly isEmpty = this.searchState.isEmpty;

  // Pagination
  readonly currentPage = this.searchState.displayPage;
  readonly totalPages = this.searchState.totalPages;
  readonly pageSize = this.searchState.pageSize;
  readonly pageNumbers = this.searchState.pageNumbers;
  readonly hasPreviousPage = this.searchState.hasPreviousPage;
  readonly hasNextPage = this.searchState.hasNextPage;
  readonly startIndex = this.searchState.startIndex;
  readonly endIndex = this.searchState.endIndex;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // Sort
  readonly sortBy = this.searchState.sortBy;
  readonly sortDirection = this.searchState.sortDirection;
  readonly sortOptions = SORT_OPTIONS;

  ngOnInit(): void {
    // Initialize with any existing query
    const existingQuery = this.searchState.query();
    if (existingQuery) {
      this.searchQuery.set(existingQuery);
    }
  }

  ngOnDestroy(): void {
    // Optionally clear search when leaving
  }

  // Search actions
  onSearch(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      this.searchState.searchImmediate(query);
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    // Debounced search as user types
    this.searchState.search(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchState.clearAll();
  }

  // Pagination actions
  goToPage(page: number | string): void {
    this.searchState.goToPage(page);
  }

  nextPage(): void {
    this.searchState.nextPage();
  }

  previousPage(): void {
    this.searchState.previousPage();
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const size = parseInt(select.value, 10);
    this.searchState.setPageSize(size);
  }

  // Sort actions
  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.searchState.setSortBy(select.value);
  }

  toggleSortDirection(): void {
    this.searchState.toggleSortDirection();
  }

  // Result actions
  viewResult(result: SearchResult): void {
    this.selectedResult.set(result);
    this.showPreviewModal.set(true);
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
    this.selectedResult.set(null);
  }

  openDocument(result: SearchResult): void {
    if (result.fileUrl) {
      this.documentViewerUrl.set(result.fileUrl);
      this.documentViewerFileName.set(result.fileName);
      this.showDocumentViewerModal.set(true);
    }
  }

  closeDocumentViewer(): void {
    this.showDocumentViewerModal.set(false);
    this.documentViewerUrl.set(null);
    this.documentViewerFileName.set(null);
  }

  // Helpers
  formatFileSize(bytes: number): string {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return this.formatDate(dateString);
  }

  getFileIcon(fileType: string): string {
    if (fileType?.includes('pdf')) {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
    if (fileType?.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
    if (fileType?.includes('word')) {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PROCESSED':
      case 'COMPLETED':
        return 'status-success';
      case 'PROCESSING':
        return 'status-processing';
      case 'FAILED':
      case 'FAILED_OCR':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PROCESSED':
        return 'Processed';
      case 'COMPLETED':
        return 'Completed';
      case 'PROCESSING':
        return 'Processing';
      case 'FAILED':
        return 'Failed';
      case 'FAILED_OCR':
        return 'OCR Failed';
      default:
        return status || 'Unknown';
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  }
}

