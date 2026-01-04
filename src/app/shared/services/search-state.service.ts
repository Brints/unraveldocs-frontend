import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, debounceTime, Subject, switchMap } from 'rxjs';
import { SearchService } from './search.service';
import {
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchFilters,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../models/search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchStateService {
  private readonly api = inject(SearchService);
  private readonly searchSubject = new Subject<string>();

  // ==================== State Signals ====================

  private readonly _query = signal('');
  private readonly _results = signal<SearchResult[]>([]);
  private readonly _totalHits = signal(0);
  private readonly _currentPage = signal(0); // 0-indexed for API
  private readonly _pageSize = signal(DEFAULT_PAGE_SIZE);
  private readonly _totalPages = signal(0);
  private readonly _sortBy = signal('createdAt');
  private readonly _sortDirection = signal<'asc' | 'desc'>('desc');
  private readonly _filters = signal<SearchFilters>({});
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _hasSearched = signal(false);
  private readonly _searchType = signal<'quick' | 'advanced' | 'content'>('quick');

  // ==================== Public Readonly Signals ====================

  readonly query = this._query.asReadonly();
  readonly results = this._results.asReadonly();
  readonly totalHits = this._totalHits.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortDirection = this._sortDirection.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasSearched = this._hasSearched.asReadonly();
  readonly searchType = this._searchType.asReadonly();

  // Page size options
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // ==================== Computed Properties ====================

  readonly hasResults = computed(() => this._results().length > 0);
  readonly isEmpty = computed(() => this._hasSearched() && this._results().length === 0);

  // For 1-based display in UI
  readonly displayPage = computed(() => this._currentPage() + 1);

  readonly hasPreviousPage = computed(() => this._currentPage() > 0);
  readonly hasNextPage = computed(() => this._currentPage() < this._totalPages() - 1);

  readonly startIndex = computed(() => {
    if (this._totalHits() === 0) return 0;
    return this._currentPage() * this._pageSize() + 1;
  });

  readonly endIndex = computed(() => {
    const end = (this._currentPage() + 1) * this._pageSize();
    return Math.min(end, this._totalHits());
  });

  readonly pageNumbers = computed(() => {
    const total = this._totalPages();
    const current = this._currentPage() + 1; // 1-based for display
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
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

  constructor() {
    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(query => {
        if (!query.trim()) {
          this.clearResults();
          return of(null);
        }
        return this.executeSearch();
      })
    ).subscribe();
  }

  // ==================== Search Actions ====================

  /**
   * Perform a quick search (debounced)
   */
  search(query: string): void {
    this._query.set(query);
    this._searchType.set('quick');
    this.searchSubject.next(query);
  }

  /**
   * Perform an immediate search without debounce
   */
  searchImmediate(query: string): void {
    this._query.set(query);
    this._currentPage.set(0);
    this._hasSearched.set(true);
    this.executeSearch().subscribe();
  }

  /**
   * Advanced search with filters
   */
  advancedSearch(query: string, filters: SearchFilters): void {
    this._query.set(query);
    this._filters.set(filters);
    this._searchType.set('advanced');
    this._currentPage.set(0);
    this._hasSearched.set(true);
    this.executeAdvancedSearch().subscribe();
  }

  /**
   * Search document content (full-text)
   */
  contentSearch(query: string): void {
    this._query.set(query);
    this._searchType.set('content');
    this._currentPage.set(0);
    this._hasSearched.set(true);
    this.executeContentSearch().subscribe();
  }

  /**
   * Execute the current search
   */
  private executeSearch() {
    const query = this._query();
    if (!query.trim()) {
      return of(null);
    }

    this._isLoading.set(true);
    this._error.set(null);
    this._hasSearched.set(true);

    return this.api.quickSearch(
      query,
      this._currentPage(),
      this._pageSize(),
      this._sortBy(),
      this._sortDirection()
    ).pipe(
      tap(response => this.handleSearchResponse(response)),
      catchError(error => {
        this._error.set('Search failed. Please try again.');
        console.error('Search error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Execute advanced search with filters
   */
  private executeAdvancedSearch() {
    const request: SearchRequest = {
      query: this._query(),
      page: this._currentPage(),
      size: this._pageSize(),
      sortBy: this._sortBy(),
      sortDirection: this._sortDirection(),
      filters: this._filters()
    };

    this._isLoading.set(true);
    this._error.set(null);

    return this.api.searchDocuments(request).pipe(
      tap(response => this.handleSearchResponse(response)),
      catchError(error => {
        this._error.set('Search failed. Please try again.');
        console.error('Advanced search error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Execute content search
   */
  private executeContentSearch() {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.searchContent(
      this._query(),
      this._currentPage(),
      this._pageSize()
    ).pipe(
      tap(response => this.handleSearchResponse(response)),
      catchError(error => {
        this._error.set('Content search failed. Please try again.');
        console.error('Content search error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Handle search response
   */
  private handleSearchResponse(response: SearchResponse): void {
    this._results.set(response.results);
    this._totalHits.set(response.totalHits);
    this._totalPages.set(response.totalPages);
  }

  // ==================== Pagination Actions ====================

  /**
   * Go to specific page (1-indexed from UI)
   */
  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      const pageIndex = page - 1; // Convert to 0-indexed
      if (pageIndex >= 0 && pageIndex < this._totalPages()) {
        this._currentPage.set(pageIndex);
        this.refreshSearch();
      }
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this._currentPage.update(p => p + 1);
      this.refreshSearch();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this._currentPage.update(p => p - 1);
      this.refreshSearch();
    }
  }

  /**
   * Change page size
   */
  setPageSize(size: number): void {
    if (PAGE_SIZE_OPTIONS.includes(size)) {
      this._pageSize.set(size);
      this._currentPage.set(0); // Reset to first page
      if (this._hasSearched()) {
        this.refreshSearch();
      }
    }
  }

  // ==================== Sort Actions ====================

  /**
   * Change sort field
   */
  setSortBy(field: string): void {
    this._sortBy.set(field);
    this._currentPage.set(0);
    if (this._hasSearched()) {
      this.refreshSearch();
    }
  }

  /**
   * Change sort direction
   */
  setSortDirection(direction: 'asc' | 'desc'): void {
    this._sortDirection.set(direction);
    this._currentPage.set(0);
    if (this._hasSearched()) {
      this.refreshSearch();
    }
  }

  /**
   * Toggle sort direction
   */
  toggleSortDirection(): void {
    this._sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    this._currentPage.set(0);
    if (this._hasSearched()) {
      this.refreshSearch();
    }
  }

  // ==================== Filter Actions ====================

  /**
   * Update filters
   */
  setFilters(filters: SearchFilters): void {
    this._filters.set(filters);
    this._currentPage.set(0);
    if (this._hasSearched()) {
      this.refreshSearch();
    }
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this._filters.set({});
    this._currentPage.set(0);
    if (this._hasSearched()) {
      this.refreshSearch();
    }
  }

  // ==================== Utility Actions ====================

  /**
   * Refresh current search
   */
  private refreshSearch(): void {
    const searchType = this._searchType();
    switch (searchType) {
      case 'advanced':
        this.executeAdvancedSearch().subscribe();
        break;
      case 'content':
        this.executeContentSearch().subscribe();
        break;
      default:
        this.executeSearch().subscribe();
    }
  }

  /**
   * Clear all results and reset state
   */
  clearResults(): void {
    this._results.set([]);
    this._totalHits.set(0);
    this._totalPages.set(0);
    this._hasSearched.set(false);
    this._error.set(null);
  }

  /**
   * Clear everything including query
   */
  clearAll(): void {
    this._query.set('');
    this._currentPage.set(0);
    this._filters.set({});
    this.clearResults();
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}

