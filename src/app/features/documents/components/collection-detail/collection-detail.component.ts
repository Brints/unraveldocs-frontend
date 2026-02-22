import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentStateService } from '../../services/document-state.service';
import { DocumentFile, ViewMode, MoveDocumentRequest, ContentFormat, PageSelectionOptions, OcrData } from '../../models/document.model';
import { DocumentViewerComponent } from '../../../../shared/components/document-viewer/document-viewer.component';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';
import { SafeHtmlPipe } from '../../../../shared/pipes/safe-html.pipe';
import { AiStateService } from '../../../ai/services/ai-state.service';
import { SummaryType } from '../../../ai/models/ai.model';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DocumentViewerComponent, RichTextEditorComponent, SafeHtmlPipe],
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.css']
})
export class CollectionDetailComponent implements OnInit {
  protected readonly documentState = inject(DocumentStateService);
  protected readonly aiState = inject(AiStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  collectionId = signal<string>('');
  searchQuery = signal('');
  showDeleteModal = signal(false);
  documentToDelete = signal<DocumentFile | null>(null);
  showOcrModal = signal(false);
  selectedDocument = signal<DocumentFile | null>(null);
  ocrData = signal<OcrData | null>(null);
  ocrDataLoading = signal(false);
  ocrViewTab = signal<'extracted' | 'edited'>('extracted');

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

  // Document viewer
  showDocumentViewer = signal(false);
  documentViewerUrl = signal<string | null>(null);
  documentViewerFileName = signal<string | null>(null);

  // Page selection for OCR
  showPageSelectionModal = signal(false);
  pageSelectionDocument = signal<DocumentFile | null>(null);
  pageSelectionMode = signal<'all' | 'range' | 'specific'>('all');
  startPage = signal<number | null>(null);
  endPage = signal<number | null>(null);
  specificPages = signal('');

  // Content editing
  showEditContentModal = signal(false);
  editDocument = signal<DocumentFile | null>(null);
  editContent = signal('');
  editFormat = signal<ContentFormat>('HTML');

  // AI Summary
  showSummaryModal = signal(false);
  summaryDocument = signal<DocumentFile | null>(null);
  summaryType = signal<SummaryType>('SHORT');

  // AI Classify
  showClassifyModal = signal(false);
  classifyDocument = signal<DocumentFile | null>(null);

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
    if (this.isPdf(document)) {
      this.openPageSelectionModal(document);
    } else {
      this.documentState.extractText(this.collectionId(), document.documentId);
    }
  }

  // Page Selection for OCR
  openPageSelectionModal(document: DocumentFile): void {
    this.pageSelectionDocument.set(document);
    this.pageSelectionMode.set('all');
    this.startPage.set(null);
    this.endPage.set(null);
    this.specificPages.set('');
    this.showPageSelectionModal.set(true);
  }

  closePageSelectionModal(): void {
    this.showPageSelectionModal.set(false);
    this.pageSelectionDocument.set(null);
  }

  setPageSelectionMode(mode: 'all' | 'range' | 'specific'): void {
    this.pageSelectionMode.set(mode);
  }

  onStartPageChange(event: Event): void {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    this.startPage.set(isNaN(val) ? null : val);
  }

  onEndPageChange(event: Event): void {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    this.endPage.set(isNaN(val) ? null : val);
  }

  onSpecificPagesChange(event: Event): void {
    this.specificPages.set((event.target as HTMLInputElement).value);
  }

  extractWithPageSelection(): void {
    const doc = this.pageSelectionDocument();
    if (!doc) return;

    let pageOptions: PageSelectionOptions | undefined;
    const mode = this.pageSelectionMode();

    if (mode === 'range') {
      const start = this.startPage();
      const end = this.endPage();
      if (start != null || end != null) {
        pageOptions = { startPage: start || undefined, endPage: end || undefined };
      }
    } else if (mode === 'specific') {
      const pagesStr = this.specificPages().trim();
      if (pagesStr) {
        const pages = pagesStr
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n) && n > 0);
        if (pages.length > 0) {
          pageOptions = { pages };
        }
      }
    }

    this.documentState.extractText(this.collectionId(), doc.documentId, pageOptions);
    this.closePageSelectionModal();
  }

  isPdf(document: DocumentFile): boolean {
    return document.mimeType === 'application/pdf' ||
      document.originalFileName?.toLowerCase().endsWith('.pdf');
  }

  // AI Summarize
  openSummaryModal(document: DocumentFile): void {
    this.summaryDocument.set(document);
    this.summaryType.set('SHORT');
    this.aiState.clearSummaryResult();
    this.showSummaryModal.set(true);
  }

  closeSummaryModal(): void {
    this.showSummaryModal.set(false);
    this.summaryDocument.set(null);
  }

  summarizeDocument(): void {
    const doc = this.summaryDocument();
    if (!doc) return;
    this.aiState.summarize(doc.documentId, this.summaryType());
  }

  onSummaryTypeChange(event: Event): void {
    this.summaryType.set((event.target as HTMLSelectElement).value as SummaryType);
  }

  // AI Classify
  openClassifyModal(document: DocumentFile): void {
    this.classifyDocument.set(document);
    this.aiState.clearClassifyResult();
    this.showClassifyModal.set(true);
    this.aiState.classify(document.documentId);
  }

  closeClassifyModal(): void {
    this.showClassifyModal.set(false);
    this.classifyDocument.set(null);
  }

  // Content Editing
  openEditContentModal(document: DocumentFile): void {
    this.editDocument.set(document);
    this.editContent.set(document.extractedText || '');
    this.editFormat.set('HTML');
    this.showEditContentModal.set(true);
  }

  closeEditContentModal(): void {
    this.showEditContentModal.set(false);
    this.editDocument.set(null);
    this.editContent.set('');
  }

  onEditContentChange(event: Event): void {
    this.editContent.set((event.target as HTMLTextAreaElement).value);
  }

  onEditFormatChange(event: Event): void {
    this.editFormat.set((event.target as HTMLSelectElement).value as ContentFormat);
  }

  saveEditedContent(): void {
    const doc = this.editDocument();
    if (!doc) return;

    const content = this.editContent().trim();
    if (!content) return;

    this.documentState.updateContent(
      this.collectionId(),
      doc.documentId,
      content,
      this.editFormat()
    );
    this.closeEditContentModal();
  }

  viewOcrResult(document: DocumentFile): void {
    this.selectedDocument.set(document);
    this.ocrData.set(null);
    this.ocrDataLoading.set(true);
    this.ocrViewTab.set('extracted');
    this.showOcrModal.set(true);

    // Load full OCR data from the API
    this.documentState.getOcrData(this.collectionId(), document.documentId).subscribe({
      next: (data) => {
        this.ocrData.set(data);
        this.ocrDataLoading.set(false);
      },
      error: () => {
        this.ocrDataLoading.set(false);
      }
    });
  }

  closeOcrModal(): void {
    this.showOcrModal.set(false);
    this.selectedDocument.set(null);
    this.ocrData.set(null);
    this.ocrDataLoading.set(false);
  }

  setOcrViewTab(tab: 'extracted' | 'edited'): void {
    this.ocrViewTab.set(tab);
  }

  getDocTypeIcon(docType: string | null | undefined): string {
    if (!docType) return '📄';
    const icons: Record<string, string> = {
      'invoice': '🧾',
      'receipt': '🧾',
      'contract': '📑',
      'letter': '✉️',
      'id_document': '🪪',
      'medical': '🏥',
      'legal': '⚖️',
      'academic': '🎓',
      'report': '📊',
      'form': '📋',
      'other': '📄'
    };
    return icons[docType] || '📄';
  }

  getDocTypeLabel(docType: string | null | undefined): string {
    if (!docType) return 'Unknown';
    return docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  getOtherCollections() {
    return this.collections().filter(c => c.id !== this.collectionId());
  }

  // Open file in document viewer
  openFileViewer(document: DocumentFile): void {
    if (document.fileUrl) {
      this.documentViewerUrl.set(document.fileUrl);
      this.documentViewerFileName.set(this.getDocumentDisplayName(document));
      this.showDocumentViewer.set(true);
    }
  }

  closeDocumentViewer(): void {
    this.showDocumentViewer.set(false);
    this.documentViewerUrl.set(null);
    this.documentViewerFileName.set(null);
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

