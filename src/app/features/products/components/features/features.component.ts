import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'features.component.html',
  styleUrls: ['features.component.css']
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
