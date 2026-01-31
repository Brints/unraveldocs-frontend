import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.css']
})
export class DocumentViewerComponent {
  @Input() fileUrl: string | null = null;
  @Input() fileName: string | null = null;
  @Output() closed = new EventEmitter<void>();

  zoomLevel = signal(100);

  close(): void {
    this.zoomLevel.set(100);
    this.closed.emit();
  }

  zoomIn(): void {
    const currentZoom = this.zoomLevel();
    if (currentZoom < 300) {
      this.zoomLevel.set(Math.min(currentZoom + 25, 300));
    }
  }

  zoomOut(): void {
    const currentZoom = this.zoomLevel();
    if (currentZoom > 25) {
      this.zoomLevel.set(Math.max(currentZoom - 25, 25));
    }
  }

  resetZoom(): void {
    this.zoomLevel.set(100);
  }

  openInNewTab(): void {
    if (this.fileUrl) {
      window.open(this.fileUrl, '_blank');
    }
  }
}
