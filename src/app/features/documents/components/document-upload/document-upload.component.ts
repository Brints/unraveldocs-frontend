import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentStateService } from '../../services/document-state.service';
import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  UploadProgress
} from '../../models/document.model';

interface FileWithPreview {
  file: File;
  preview?: string;
  error?: string;
}

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css']
})
export class DocumentUploadComponent {
  protected readonly documentState = inject(DocumentStateService);
  private readonly router = inject(Router);

  // Local state
  selectedFiles = signal<FileWithPreview[]>([]);
  isDragOver = signal(false);
  extractOcrOnUpload = signal(true);

  // From state service
  readonly isUploading = this.documentState.isUploading;
  readonly uploadProgress = this.documentState.uploadProgress;
  readonly error = this.documentState.error;
  readonly successMessage = this.documentState.successMessage;

  // Constants
  readonly maxFileSize = MAX_FILE_SIZE;
  readonly maxFiles = MAX_FILES_PER_UPLOAD;
  readonly supportedTypes = SUPPORTED_FILE_TYPES;

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
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
      input.value = ''; // Reset input
    }
  }

  private handleFiles(files: File[]): void {
    const currentCount = this.selectedFiles().length;
    const availableSlots = this.maxFiles - currentCount;

    if (availableSlots <= 0) {
      this.documentState.clearError();
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);
    const newFiles: FileWithPreview[] = [];

    for (const file of filesToAdd) {
      const validation = this.validateFile(file);

      if (validation.valid) {
        const fileWithPreview: FileWithPreview = { file };

        // Generate preview for images
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        newFiles.push(fileWithPreview);
      } else {
        newFiles.push({ file, error: validation.error });
      }
    }

    this.selectedFiles.update(current => [...current, ...newFiles]);
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type' };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return { valid: false, error: 'File exceeds 10MB limit' };
    }

    // Check for duplicates
    const isDuplicate = this.selectedFiles().some(
      f => f.file.name === file.name && f.file.size === file.size
    );
    if (isDuplicate) {
      return { valid: false, error: 'File already selected' };
    }

    return { valid: true };
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    const file = files[index];

    // Revoke preview URL if exists
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }

    this.selectedFiles.update(current =>
      current.filter((_, i) => i !== index)
    );
  }

  clearAllFiles(): void {
    // Revoke all preview URLs
    for (const file of this.selectedFiles()) {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    }
    this.selectedFiles.set([]);
  }

  upload(): void {
    const validFiles = this.selectedFiles()
      .filter(f => !f.error)
      .map(f => f.file);

    if (validFiles.length === 0) return;

    this.documentState.uploadFiles(validFiles, this.extractOcrOnUpload());

    // Navigate to documents list after a short delay
    setTimeout(() => {
      if (!this.error()) {
        this.router.navigate(['/documents']);
      }
    }, 2000);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (mimeType === 'application/pdf') {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
    if (mimeType.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
    if (mimeType.includes('word')) {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }

  getFileTypeLabel(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'image/jpeg') return 'JPEG';
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/gif') return 'GIF';
    if (mimeType === 'image/webp') return 'WebP';
    if (mimeType === 'image/tiff') return 'TIFF';
    if (mimeType.includes('word')) return 'DOC';
    return 'FILE';
  }

  get hasValidFiles(): boolean {
    return this.selectedFiles().some(f => !f.error);
  }

  get validFileCount(): number {
    return this.selectedFiles().filter(f => !f.error).length;
  }

  get overallProgress(): number {
    const progress = this.uploadProgress();
    if (progress.length === 0) return 0;
    const total = progress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(total / progress.length);
  }
}

