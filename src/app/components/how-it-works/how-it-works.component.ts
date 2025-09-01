import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-24 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20">
          <h2 class="section-title">How It Works</h2>
          <p class="section-subtitle">
            Simple, fast, and reliable document conversion in just three steps
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-12 mb-16">
          <div class="step-item text-center" *ngFor="let step of steps; let i = index">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-content">
              <div class="step-icon" [innerHTML]="step.icon"></div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">{{ step.title }}</h3>
              <p class="text-gray-600 leading-relaxed">{{ step.description }}</p>
            </div>
          </div>
        </div>

        <!-- Interactive Upload Demo -->
        <div class="flex justify-center">
          <div class="upload-demo-zone" [class.dragover]="isDragOver"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="triggerFileInput()">
            <input #fileInput type="file" accept="image/*,.pdf" multiple class="hidden"
                   (change)="onFileSelected($event)">

            <svg class="w-24 h-24 text-blue-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>

            <h4 class="text-2xl font-bold text-gray-900 mb-2">Try it now!</h4>
            <p class="text-gray-600 mb-4">Drop your documents here or click to browse</p>
            <span class="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">
              PNG, JPG, JPEG, PDF
            </span>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HowItWorksComponent {
  isDragOver = false;

  steps = [
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>`,
      title: 'Upload Your Document',
      description: 'Simply drag and drop your image files or click to browse. We support PNG, JPG, JPEG, and PDF formats.'
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>`,
      title: 'AI Processing',
      description: 'Our advanced AI analyzes your document, extracts text with high accuracy, and formats it professionally.'
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
      title: 'Download & Edit',
      description: 'Download your converted DOCX file instantly and start editing in Microsoft Word or any compatible editor.'
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
    if (files) {
      this.processFiles(files);
    }
  }

  triggerFileInput() {
    console.log('File input triggered');
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.processFiles(files);
    }
  }

  private processFiles(files: FileList) {
    console.log('Processing files:', files);
  }
}

