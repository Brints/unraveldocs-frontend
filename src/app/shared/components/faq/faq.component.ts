import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  isOpen: boolean;
  icon?: string;
  tags?: string[];
}

interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [FormsModule],
  templateUrl: 'faq.component.html',
  styleUrls: ['faq.component.css']
})
export class FaqComponent {
  @Input() searchable = true;
  @Output() questionClicked = new EventEmitter<string>();

  searchTerm = signal('');
  selectedCategory = signal<string>('all');

  faqs: FAQ[] = [
    {
      id: '1',
      category: 'general',
      question: 'What is UnravelDocs and how does it work?',
      answer: 'UnravelDocs is a powerful document processing platform that uses advanced AI to extract, analyze, and transform your documents. Simply upload your files, and our AI processes them instantly with 99.5% accuracy, preserving formatting and structure.',
      isOpen: false,
      icon: '🚀',
      tags: ['platform', 'AI', 'processing']
    },
    {
      id: '2',
      category: 'pricing',
      question: 'Is there a free plan available?',
      answer: 'Yes! We offer a generous free plan that includes 10 documents per month, basic features, and standard processing speed. You can upgrade anytime to access unlimited documents, advanced features, priority processing, and team collaboration tools.',
      isOpen: false,
      icon: '💰',
      tags: ['free', 'plan', 'pricing']
    },
    {
      id: '3',
      category: 'features',
      question: 'What file formats do you support?',
      answer: 'We support all major document formats including PDF, DOCX, DOC, TXT, RTF, ODT, images (PNG, JPG, JPEG), and more. Our AI can process both scanned documents and native digital files with the same high accuracy.',
      isOpen: false,
      icon: '📄',
      tags: ['formats', 'files', 'support']
    },
    {
      id: '4',
      category: 'security',
      question: 'How secure is my data?',
      answer: 'Security is our top priority. We use bank-level 256-bit encryption, secure cloud storage, automatic data deletion after processing, and comply with GDPR, SOC 2, and ISO 27001 standards. Your documents are always protected and never shared.',
      isOpen: false,
      icon: '🔒',
      tags: ['security', 'encryption', 'privacy']
    },
    {
      id: '5',
      category: 'features',
      question: 'Can I process documents in batch?',
      answer: 'Absolutely! Our platform supports batch processing, allowing you to upload and process multiple documents simultaneously. Premium plans offer unlimited batch processing with priority queue handling for faster results.',
      isOpen: false,
      icon: '📚',
      tags: ['batch', 'multiple', 'processing']
    },
    {
      id: '6',
      category: 'general',
      question: 'How accurate is the AI processing?',
      answer: 'Our AI achieves 99.5% accuracy across all document types. We use state-of-the-art machine learning models trained on millions of documents, with continuous improvements. For critical documents, we offer manual review options on premium plans.',
      isOpen: false,
      icon: '🎯',
      tags: ['accuracy', 'AI', 'quality']
    },
    {
      id: '7',
      category: 'support',
      question: 'What kind of customer support do you provide?',
      answer: 'We provide comprehensive support including detailed documentation, video tutorials, email support (24-48h response), and live chat for premium users. Enterprise plans include dedicated account managers and priority phone support.',
      isOpen: false,
      icon: '🤝',
      tags: ['support', 'help', 'customer service']
    },
    {
      id: '8',
      category: 'features',
      question: 'Can I export processed documents in different formats?',
      answer: 'Yes! After processing, you can export your documents in multiple formats including TXT, DOCX, PDF (searchable), JSON, CSV, and more. All exports maintain the original formatting and structure.',
      isOpen: false,
      icon: '⬇️',
      tags: ['export', 'formats', 'download']
    },
    {
      id: '9',
      category: 'pricing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time with no penalties or hidden fees. Your account will remain active until the end of your billing period, and you can always reactivate later.',
      isOpen: false,
      icon: '🔄',
      tags: ['cancel', 'subscription', 'billing']
    },
    {
      id: '10',
      category: 'security',
      question: 'Do you store my documents?',
      answer: 'We store documents temporarily during processing (24-48 hours) and then automatically delete them from our servers. Premium users can opt for permanent storage with encryption. You have full control over your data.',
      isOpen: false,
      icon: '🗑️',
      tags: ['storage', 'deletion', 'data']
    }
  ];

  categories: FAQCategory[] = [
    { id: 'all', name: 'All Questions', icon: '📋', count: 0 },
    { id: 'general', name: 'General', icon: '💡', count: 0 },
    { id: 'features', name: 'Features', icon: '⚡', count: 0 },
    { id: 'pricing', name: 'Pricing', icon: '💳', count: 0 },
    { id: 'security', name: 'Security', icon: '🔐', count: 0 },
    { id: 'support', name: 'Support', icon: '💬', count: 0 }
  ];

  constructor() {
    this.updateCategoryCounts();
  }

  filteredFAQs = computed(() => {
    let faqs = [...this.faqs];

    // Filter by category
    if (this.selectedCategory() !== 'all') {
      faqs = faqs.filter(faq => faq.category === this.selectedCategory());
    }

    // Filter by search term
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      faqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return faqs;
  });

  toggleFAQ(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
    this.questionClicked.emit(faq.id);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private updateCategoryCounts(): void {
    this.categories.forEach(category => {
      if (category.id === 'all') {
        category.count = this.faqs.length;
      } else {
        category.count = this.faqs.filter(faq => faq.category === category.id).length;
      }
    });
  }

  getCategoryCount(categoryId: string): number {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.count || 0;
  }
}
