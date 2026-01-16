import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentStateService } from '../../services/document-state.service';
import { DocumentCollection, ViewMode, DocumentSort, CollectionStatus } from '../../models/document.model';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css']
})
export class DocumentsListComponent implements OnInit {
  protected readonly documentState = inject(DocumentStateService);

  // Local state
  searchQuery = signal('');
  showDeleteModal = signal(false);
  collectionToDelete = signal<DocumentCollection | null>(null);
  showRenameModal = signal(false);
  collectionToRename = signal<DocumentCollection | null>(null);
  newCollectionName = signal('');

  // From state service
  readonly collections = this.documentState.collections;
  readonly isLoading = this.documentState.isLoading;
  readonly error = this.documentState.error;
  readonly successMessage = this.documentState.successMessage;
  readonly viewMode = this.documentState.viewMode;
  readonly totalCollections = this.documentState.totalCollections;
  readonly totalDocuments = this.documentState.totalDocuments;

  // Filtered collections - search by name or ID
  readonly filteredCollections = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.collections();
    return this.collections().filter(col =>
      col.name.toLowerCase().includes(query) ||
      col.id.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.documentState.loadCollections();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setViewMode(mode: ViewMode): void {
    this.documentState.setViewMode(mode);
  }

  // Rename modal
  openRenameModal(collection: DocumentCollection, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.collectionToRename.set(collection);
    this.newCollectionName.set(collection.name);
    this.showRenameModal.set(true);
  }

  renameCollection(): void {
    const collection = this.collectionToRename();
    const name = this.newCollectionName().trim();
    if (collection && name && name !== collection.name) {
      this.documentState.updateCollectionName(collection.id, name);
    }
    this.closeRenameModal();
  }

  closeRenameModal(): void {
    this.showRenameModal.set(false);
    this.collectionToRename.set(null);
    this.newCollectionName.set('');
  }

  confirmDeleteCollection(collection: DocumentCollection): void {
    this.collectionToDelete.set(collection);
    this.showDeleteModal.set(true);
  }

  deleteCollection(): void {
    const collection = this.collectionToDelete();
    if (collection) {
      this.documentState.deleteCollection(collection.id);
      this.closeDeleteModal();
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.collectionToDelete.set(null);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return this.formatDate(dateString);
  }

  getStatusLabel(status: CollectionStatus): string {
    const statusLabels: Record<CollectionStatus, string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'processed': 'Processed',
      'completed': 'Completed',
      'failed': 'Failed',
      'failed_ocr': 'OCR Failed',
      'partially_completed': 'Partial',
      'failed_upload': 'Upload Failed'
    };
    return statusLabels[status] || status;
  }
}

