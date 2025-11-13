import { Component, ViewChild, ElementRef, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  features: string[];
  duration: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css']
})
export class HowItWorksComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() variant = 'default';
  @Output() stepClicked = new EventEmitter<string>();

  isDragOver = false;
  activeStep = signal<number>(0);
  hoveredStep = signal<number | null>(null);

  steps: Step[] = [
    {
      id: '1',
      title: 'Upload Your Document',
      description: 'Simply drag and drop your files or click to browse. We support multiple formats and batch processing.',
      icon: '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      features: ['Drag & Drop', 'Batch Upload', 'All Formats'],
      duration: '< 1 sec'
    },
    {
      id: '2',
      title: 'AI Processing',
      description: 'Our advanced AI analyzes your document with 99.5% accuracy, preserving formatting and structure perfectly.',
      icon: '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: ['99.5% Accuracy', 'Smart Recognition', 'Format Preservation'],
      duration: '2-5 sec'
    },
    {
      id: '3',
      title: 'Download & Share',
      description: 'Get your editable text file instantly. Export to multiple formats and share with your team seamlessly.',
      icon: '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: ['Multiple Formats', 'Instant Download', 'Easy Sharing'],
      duration: 'Instant'
    }
  ];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(files: FileList) {
    console.log('Files selected:', Array.from(files).map(f => f.name));
    // Handle file upload logic here
  }

  onStepClick(stepId: string) {
    this.stepClicked.emit(stepId);
  }

  onStepHover(index: number) {
    this.hoveredStep.set(index);
  }

  onStepLeave() {
    this.hoveredStep.set(null);
  }

  isStepActive(index: number): boolean {
    return this.activeStep() === index;
  }

  isStepHovered(index: number): boolean {
    return this.hoveredStep() === index;
  }
}
