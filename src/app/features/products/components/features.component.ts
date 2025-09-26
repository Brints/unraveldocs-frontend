import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20">
          <h2 class="section-title">Powerful Features for Document Processing</h2>
          <p class="section-subtitle">
            Everything you need to digitize and convert your documents with precision and speed
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="feature-card group" *ngFor="let feature of features; let i = index" (click)="onFeatureClick(feature.id)">
            <div class="feature-icon" [innerHTML]="feature.icon"></div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">{{ feature.title }}</h3>
            <p class="text-gray-600 mb-6 leading-relaxed">{{ feature.description }}</p>
            <ul class="space-y-3">
              <li *ngFor="let point of feature.points" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="text-gray-700">{{ point }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .feature-card {
      @apply bg-white p-8 rounded-2xl shadow-lg border border-gray-100
             transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-blue-200;
      animation: fadeInUp 0.6s ease forwards;
      opacity: 0;
      transform: translateY(30px);
      cursor: pointer;
    }

    .feature-card:nth-child(1) { animation-delay: 0.1s; }
    .feature-card:nth-child(2) { animation-delay: 0.2s; }
    .feature-card:nth-child(3) { animation-delay: 0.3s; }
    .feature-card:nth-child(4) { animation-delay: 0.4s; }
    .feature-card:nth-child(5) { animation-delay: 0.5s; }
    .feature-card:nth-child(6) { animation-delay: 0.6s; }

    .feature-icon {
      @apply w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl
             flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300;
    }

    .feature-icon svg {
      @apply w-8 h-8 text-white;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class FeaturesComponent {
  @Input() lazyLoad = false;
  @Output() featureClicked = new EventEmitter<string>();
  @Output() imageLoad = new EventEmitter<string>();
  @Output() imageError = new EventEmitter<string>();

  features = [
    {
      id: 'ocr',
      title: 'Advanced OCR Technology',
      description: 'Extract text from images and PDFs with industry-leading accuracy using our cutting-edge OCR engine.',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      points: [
        '99.9% accuracy rate',
        'Multi-language support',
        'Handwriting recognition'
      ]
    },
    {
      id: 'conversion',
      title: 'Multi-Format Conversion',
      description: 'Convert between various document formats seamlessly while preserving formatting and quality.',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/></svg>`,
      points: [
        'PDF, Word, Excel, PowerPoint',
        'Maintains original formatting',
        'Batch processing available'
      ]
    },
    {
      id: 'automation',
      title: 'Intelligent Automation',
      description: 'Automate your document workflows with smart processing and routing capabilities.',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>`,
      points: [
        'Smart document classification',
        'Automated data extraction',
        'Custom workflow rules'
      ]
    }
  ];

  onFeatureClick(featureId: string): void {
    this.featureClicked.emit(featureId);
  }

  onImageLoadSuccess(imageSrc: string): void {
    this.imageLoad.emit(imageSrc);
  }

  onImageLoadError(imageSrc: string): void {
    this.imageError.emit(imageSrc);
  }
}
