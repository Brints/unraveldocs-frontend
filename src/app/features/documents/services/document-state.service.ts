import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { catchError, of, tap, finalize } from 'rxjs';
import { DocumentApiService } from './document-api.service';
import {
  DocumentCollection,
  DocumentFile,
  UploadProgress,
  UploadOptions,
  DocumentFilter,
  DocumentSort,
  ViewMode,
  FileStatus,
  MoveDocumentRequest,
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentStateService {
  private readonly api = inject(DocumentApiService);

  // ==================== State Signals ====================

  private readonly _collections = signal<DocumentCollection[]>([]);
  private readonly _currentCollection = signal<DocumentCollection | null>(null);
  private readonly _currentDocument = signal<DocumentFile | null>(null);
  private readonly _uploadProgress = signal<UploadProgress[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isUploading = signal(false);
  private readonly _isProcessingOcr = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _viewMode = signal<ViewMode>('grid');
  private readonly _filter = signal<DocumentFilter>({});
  private readonly _sort = signal<DocumentSort>({ field: 'createdAt', direction: 'desc' });
  private readonly _selectedDocuments = signal<Set<string>>(new Set());

  // ==================== Public Readonly Signals ====================

  readonly collections = this._collections.asReadonly();
  readonly currentCollection = this._currentCollection.asReadonly();
  readonly currentDocument = this._currentDocument.asReadonly();
  readonly uploadProgress = this._uploadProgress.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUploading = this._isUploading.asReadonly();
  readonly isProcessingOcr = this._isProcessingOcr.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly viewMode = this._viewMode.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly selectedDocuments = this._selectedDocuments.asReadonly();

  // ==================== Computed Properties ====================

  readonly totalCollections = computed(() => this._collections().length);

  readonly totalDocuments = computed(() => {
    return this._collections().reduce((sum, col) => sum + (col.fileCount || 0), 0);
  });

  readonly hasCollections = computed(() => this._collections().length > 0);

  readonly currentCollectionDocuments = computed(() => {
    const collection = this._currentCollection();
    return collection?.files || [];
  });

  readonly filteredDocuments = computed(() => {
    let documents = this.currentCollectionDocuments();
    const currentFilter = this._filter();

    if (currentFilter.searchQuery) {
      const query = currentFilter.searchQuery.toLowerCase();
      documents = documents.filter(doc =>
        doc.originalFileName.toLowerCase().includes(query)
      );
    }

    if (currentFilter.status) {
      const statusFilter = currentFilter.status;
      documents = documents.filter(doc => doc.status === statusFilter);
    }

    if (currentFilter.ocrProcessed !== undefined) {
      documents = documents.filter(doc => doc.ocrProcessed === currentFilter.ocrProcessed);
    }

    // Apply sorting
    const sortConfig = this._sort();
    documents = [...documents].sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'fileName':
          comparison = a.originalFileName.localeCompare(b.originalFileName);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'fileSize':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return documents;
  });

  readonly selectedCount = computed(() => this._selectedDocuments().size);

  readonly hasSelection = computed(() => this._selectedDocuments().size > 0);

  readonly allSelected = computed(() => {
    const documents = this.currentCollectionDocuments();
    const selected = this._selectedDocuments();
    return documents.length > 0 && documents.every(doc => selected.has(doc.documentId));
  });

  // ==================== Actions ====================

  /**
   * Load all collections
   */
  loadCollections(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getMyCollections().pipe(
      tap(collections => {
        this._collections.set(collections);
      }),
      catchError(error => {
        this._error.set('Failed to load collections');
        console.error('Load collections error:', error);
        return of([]);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load a specific collection
   */
  loadCollection(collectionId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getCollection(collectionId).pipe(
      tap(collection => {
        this._currentCollection.set(collection);
        this._selectedDocuments.set(new Set());
      }),
      catchError(error => {
        this._error.set('Failed to load collection');
        console.error('Load collection error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Upload files
   */
  uploadFiles(files: File[], extractOcr = false, options?: UploadOptions): void {
    if (files.length === 0) return;

    this._isUploading.set(true);
    this._error.set(null);

    // Initialize progress tracking
    const progressItems: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    this._uploadProgress.set(progressItems);

    const uploadObservable = extractOcr
      ? this.api.uploadAndExtractAll(files, options)
      : this.api.uploadDocuments(files, options);

    uploadObservable.pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this._uploadProgress.update(items =>
            items.map(item => ({ ...item, progress, status: 'uploading' as const }))
          );
        } else if (event.type === HttpEventType.Response) {
          this._uploadProgress.update(items =>
            items.map(item => ({ ...item, progress: 100, status: 'completed' as const }))
          );

          // Refresh collections after successful upload
          this.loadCollections();

          this._successMessage.set('Files uploaded successfully!');
          setTimeout(() => this._successMessage.set(null), 3000);
        }
      }),
      catchError(error => {
        const errorMessage = error?.error?.message || error?.message || 'Failed to upload files';
        this._error.set(errorMessage);
        this._uploadProgress.update(items =>
          items.map(item => ({ ...item, status: 'error' as const, error: errorMessage }))
        );
        console.error('Upload error:', error);
        return of(null);
      }),
      finalize(() => this._isUploading.set(false))
    ).subscribe();
  }

  /**
   * Delete collection
   */
  deleteCollection(collectionId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.deleteCollection(collectionId).pipe(
      tap(() => {
        this._collections.update(cols =>
          cols.filter(c => c.id !== collectionId)
        );
        if (this._currentCollection()?.id === collectionId) {
          this._currentCollection.set(null);
        }
        this._successMessage.set('Collection deleted successfully');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        this._error.set('Failed to delete collection');
        console.error('Delete collection error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Delete document from collection
   */
  deleteDocument(collectionId: string, documentId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.deleteDocument(collectionId, documentId).pipe(
      tap(() => {
        this._currentCollection.update(col => {
          if (!col) return null;
          return {
            ...col,
            files: col.files?.filter(f => f.documentId !== documentId),
            fileCount: (col.fileCount || 0) - 1
          };
        });
        this._selectedDocuments.update(set => {
          const newSet = new Set(set);
          newSet.delete(documentId);
          return newSet;
        });
        this._successMessage.set('Document deleted successfully');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        this._error.set('Failed to delete document');
        console.error('Delete document error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Clear all collections
   */
  clearAllCollections(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.clearAllCollections().pipe(
      tap(() => {
        this._collections.set([]);
        this._currentCollection.set(null);
        this._currentDocument.set(null);
        this._successMessage.set('All collections cleared');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        this._error.set('Failed to clear collections');
        console.error('Clear collections error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Update collection name
   */
  updateCollectionName(collectionId: string, name: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.updateCollectionName(collectionId, { name }).pipe(
      tap(updatedCollection => {
        // Update in collections list
        this._collections.update(cols =>
          cols.map(c => c.id === collectionId ? { ...c, name } : c)
        );
        // Update current collection if it's the one being renamed
        if (this._currentCollection()?.id === collectionId) {
          this._currentCollection.update(col => col ? { ...col, name } : null);
        }
        this._successMessage.set('Collection renamed successfully');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        const errorMessage = error?.error?.message || 'Failed to update collection name';
        this._error.set(errorMessage);
        console.error('Update collection name error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Update document display name
   */
  updateDocumentDisplayName(collectionId: string, documentId: string, displayName: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.updateDocumentDisplayName(collectionId, documentId, { displayName }).pipe(
      tap(updatedDocument => {
        // Update document in current collection
        this._currentCollection.update(col => {
          if (!col) return null;
          return {
            ...col,
            files: col.files?.map(f =>
              f.documentId === documentId ? { ...f, displayName } : f
            )
          };
        });
        this._successMessage.set('Document renamed successfully');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        this._error.set('Failed to update document name');
        console.error('Update document name error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Move document between collections (Premium feature)
   */
  moveDocument(request: MoveDocumentRequest): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.moveDocument(request).pipe(
      tap(movedDocument => {
        // Remove document from current collection
        this._currentCollection.update(col => {
          if (!col) return null;
          return {
            ...col,
            files: col.files?.filter(f => f.documentId !== request.documentId),
            fileCount: (col.fileCount || 0) - 1
          };
        });

        // Update collections list
        this._collections.update(cols =>
          cols.map(c => {
            if (c.id === request.sourceCollectionId) {
              return { ...c, fileCount: (c.fileCount || 0) - 1 };
            }
            if (c.id === request.targetCollectionId) {
              return { ...c, fileCount: (c.fileCount || 0) + 1 };
            }
            return c;
          })
        );

        this._successMessage.set('Document moved successfully');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        const errorMessage = error?.error?.message || 'Failed to move document. This feature may require a premium subscription.';
        this._error.set(errorMessage);
        console.error('Move document error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Extract text from document (OCR)
   */
  extractText(collectionId: string, documentId: string): void {
    this._isProcessingOcr.set(true);
    this._error.set(null);

    this.api.extractText(collectionId, documentId).pipe(
      tap(result => {
        // Update document with OCR result
        this._currentCollection.update(col => {
          if (!col) return null;
          return {
            ...col,
            files: col.files?.map(f =>
              f.documentId === documentId
                ? { ...f, ocrProcessed: true, extractedText: result.extractedText }
                : f
            )
          };
        });
        this._successMessage.set('Text extracted successfully!');
        setTimeout(() => this._successMessage.set(null), 3000);
      }),
      catchError(error => {
        this._error.set('Failed to extract text');
        console.error('OCR error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessingOcr.set(false))
    ).subscribe();
  }

  /**
   * Get OCR data for document
   */
  loadOcrData(collectionId: string, documentId: string): void {
    this._isLoading.set(true);

    this.api.getOcrData(collectionId, documentId).pipe(
      tap(data => {
        this._currentDocument.update(doc => {
          if (!doc) return null;
          return { ...doc, extractedText: data.extractedText };
        });
      }),
      catchError(error => {
        console.error('Load OCR data error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Download document as DOCX
   */
  downloadAsDocx(collectionId: string, documentId: string, fileName: string): void {
    this.api.downloadAsDocx(collectionId, documentId).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.replace(/\.[^/.]+$/, '') + '.docx';
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

  // ==================== View & Filter Actions ====================

  setViewMode(mode: ViewMode): void {
    this._viewMode.set(mode);
  }

  setFilter(filter: DocumentFilter): void {
    this._filter.set(filter);
  }

  updateFilter(partialFilter: Partial<DocumentFilter>): void {
    this._filter.update(current => ({ ...current, ...partialFilter }));
  }

  clearFilter(): void {
    this._filter.set({});
  }

  setSort(sort: DocumentSort): void {
    this._sort.set(sort);
  }

  // ==================== Selection Actions ====================

  selectDocument(documentId: string): void {
    this._selectedDocuments.update(set => {
      const newSet = new Set(set);
      newSet.add(documentId);
      return newSet;
    });
  }

  deselectDocument(documentId: string): void {
    this._selectedDocuments.update(set => {
      const newSet = new Set(set);
      newSet.delete(documentId);
      return newSet;
    });
  }

  toggleDocumentSelection(documentId: string): void {
    this._selectedDocuments.update(set => {
      const newSet = new Set(set);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  }

  selectAllDocuments(): void {
    const documents = this.currentCollectionDocuments();
    this._selectedDocuments.set(new Set(documents.map(d => d.documentId)));
  }

  clearSelection(): void {
    this._selectedDocuments.set(new Set());
  }

  // ==================== Utility Actions ====================

  setCurrentDocument(document: DocumentFile | null): void {
    this._currentDocument.set(document);
  }

  clearError(): void {
    this._error.set(null);
  }

  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  clearUploadProgress(): void {
    this._uploadProgress.set([]);
  }
}

