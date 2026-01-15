import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentStateService } from '../../services/document-state.service';
import { DocumentFile, ViewMode, MoveDocumentRequest } from '../../models/document.model';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.css']
})
export class CollectionDetailComponent implements OnInit {
  protected readonly documentState = inject(DocumentStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  collectionId = signal<string>('');
  searchQuery = signal('');
  showDeleteModal = signal(false);
  documentToDelete = signal<DocumentFile | null>(null);
  showOcrModal = signal(false);
  selectedDocument = signal<DocumentFile | null>(null);

  // Rename document modal
  showRenameDocModal = signal(false);
  documentToRename = signal<DocumentFile | null>(null);
  newDisplayName = signal('');

  // Rename collection modal
  showRenameCollectionModal = signal(false);
  newCollectionName = signal('');

  // Move document modal
  showMoveModal = signal(false);
  documentToMove = signal<DocumentFile | null>(null);
  targetCollectionId = signal('');

  // From state service
  readonly collection = this.documentState.currentCollection;
  readonly collections = this.documentState.collections;
  readonly filteredDocuments = this.documentState.filteredDocuments;
  readonly isLoading = this.documentState.isLoading;
  readonly isProcessingOcr = this.documentState.isProcessingOcr;
  readonly error = this.documentState.error;
  readonly successMessage = this.documentState.successMessage;
  readonly viewMode = this.documentState.viewMode;
  readonly selectedDocuments = this.documentState.selectedDocuments;
  readonly hasSelection = this.documentState.hasSelection;
  readonly selectedCount = this.documentState.selectedCount;
  readonly allSelected = this.documentState.allSelected;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['collectionId'];
      if (id) {
        this.collectionId.set(id);
        this.documentState.loadCollection(id);
        // Load all collections for move functionality
        this.documentState.loadCollections();
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.documentState.updateFilter({ searchQuery: input.value });
  }

  setViewMode(mode: ViewMode): void {
    this.documentState.setViewMode(mode);
  }

  toggleDocumentSelection(documentId: string): void {
    this.documentState.toggleDocumentSelection(documentId);
  }

  selectAll(): void {
    if (this.allSelected()) {
      this.documentState.clearSelection();
    } else {
      this.documentState.selectAllDocuments();
    }
  }

  isSelected(documentId: string): boolean {
    return this.selectedDocuments().has(documentId);
  }

  // OCR Actions
  extractText(document: DocumentFile): void {
    this.documentState.extractText(this.collectionId(), document.documentId);
  }

  viewOcrResult(document: DocumentFile): void {
    this.selectedDocument.set(document);
    this.showOcrModal.set(true);
  }

  closeOcrModal(): void {
    this.showOcrModal.set(false);
    this.selectedDocument.set(null);
  }

  downloadAsDocx(document: DocumentFile): void {
    this.documentState.downloadAsDocx(
      this.collectionId(),
      document.documentId,
      document.originalFileName
    );
  }

  // Delete Actions
  confirmDeleteDocument(document: DocumentFile): void {
    this.documentToDelete.set(document);
    this.showDeleteModal.set(true);
  }

  deleteDocument(): void {
    const document = this.documentToDelete();
    if (document) {
      this.documentState.deleteDocument(this.collectionId(), document.documentId);
      this.closeDeleteModal();
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.documentToDelete.set(null);
  }

  deleteSelectedDocuments(): void {
    const selected = this.selectedDocuments();
    selected.forEach(documentId => {
      this.documentState.deleteDocument(this.collectionId(), documentId);
    });
    this.documentState.clearSelection();
  }

  // Rename Collection
  openRenameCollectionModal(): void {
    const col = this.collection();
    if (col) {
      this.newCollectionName.set(col.name);
      this.showRenameCollectionModal.set(true);
    }
  }

  renameCollection(): void {
    const name = this.newCollectionName().trim();
    if (name) {
      this.documentState.updateCollectionName(this.collectionId(), name);
    }
    this.closeRenameCollectionModal();
  }

  closeRenameCollectionModal(): void {
    this.showRenameCollectionModal.set(false);
    this.newCollectionName.set('');
  }

  // Rename Document
  openRenameDocModal(document: DocumentFile): void {
    this.documentToRename.set(document);
    this.newDisplayName.set(document.displayName || document.originalFileName);
    this.showRenameDocModal.set(true);
  }

  renameDocument(): void {
    const doc = this.documentToRename();
    const displayName = this.newDisplayName().trim();
    if (doc && displayName) {
      this.documentState.updateDocumentDisplayName(this.collectionId(), doc.documentId, displayName);
    }
    this.closeRenameDocModal();
  }

  closeRenameDocModal(): void {
    this.showRenameDocModal.set(false);
    this.documentToRename.set(null);
    this.newDisplayName.set('');
  }

  // Move Document
  openMoveModal(document: DocumentFile): void {
    this.documentToMove.set(document);
    this.targetCollectionId.set('');
    this.showMoveModal.set(true);
  }

  moveDocument(): void {
    const doc = this.documentToMove();
    const targetId = this.targetCollectionId();
    if (doc && targetId) {
      const request: MoveDocumentRequest = {
        sourceCollectionId: this.collectionId(),
        targetCollectionId: targetId,
        documentId: doc.documentId
      };
      this.documentState.moveDocument(request);
    }
    this.closeMoveModal();
  }

  closeMoveModal(): void {
    this.showMoveModal.set(false);
    this.documentToMove.set(null);
    this.targetCollectionId.set('');
  }

  // Get other collections for move dropdown
  getOtherCollections() {
    return this.collections().filter(c => c.id !== this.collectionId());
  }

  // Get display name for document
  getDocumentDisplayName(document: DocumentFile): string {
    return document.displayName || document.originalFileName;
  }

  // Helpers
  formatDate(dateString?: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return this.formatDate(dateString);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType?: string): string {
    if (!mimeType) return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';

    if (mimeType === 'application/pdf') {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
    if (mimeType.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }

  getFileTypeClass(mimeType?: string): string {
    if (!mimeType) return 'default';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('word')) return 'word';
    return 'default';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed': return 'success';
      case 'processing': return 'processing';
      case 'failed': return 'error';
      case 'pending': return 'pending';
      default: return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status.toLowerCase()) {
      case 'success': return 'Success';
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status;
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  }
}

