import { Component } from '@angular/core';
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
          <div class="feature-card group" *ngFor="let feature of features; let i = index">
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
  features = [
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>`,
      title: 'AI-Powered OCR',
      description: 'Advanced optical character recognition powered by machine learning for exceptional accuracy.',
      points: [
        'Supports 50+ languages',
        '99.5% accuracy rate',
        'Handwritten text recognition',
        'Real-time processing'
      ]
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>`,
      title: 'Multiple Format Support',
      description: 'Upload various image formats and get perfectly formatted documents.',
      points: [
        'PNG, JPG, JPEG, PDF support',
        'Batch processing available',
        'High-resolution image support',
        'Automatic format detection'
      ]
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
      title: 'Professional Output',
      description: 'Get properly formatted DOCX files ready for editing and sharing.',
      points: [
        'Microsoft Word compatible',
        'Preserves formatting',
        'Editable text output',
        'Professional layouts'
      ]
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>`,
      title: 'Secure & Private',
      description: 'Your documents are processed securely with enterprise-grade encryption.',
      points: [
        'End-to-end encryption',
        'GDPR compliant',
        'No data retention',
        'Secure file transfer'
      ]
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>`,
      title: 'Lightning Fast',
      description: 'Process documents in seconds with our optimized processing pipeline.',
      points: [
        'Under 10 seconds processing',
        'Real-time preview',
        'Instant downloads',
        'Optimized for speed'
      ]
    },
    {
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
      </svg>`,
      title: 'Smart Enhancement',
      description: 'Automatic image enhancement and text optimization for better results.',
      points: [
        'Auto contrast adjustment',
        'Noise reduction',
        'Text straightening',
        'Quality enhancement'
      ]
    }
  ];
}

