import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="faq-section">
      <div class="container">
        <h2>Frequently Asked Questions</h2>

        @if (searchable) {
          <div class="faq-search">
            <input
              type="text"
              placeholder="Search FAQs..."
              [(ngModel)]="searchTerm"
              (input)="filterFAQs()"
              class="search-input">
          </div>
        }

        <div class="faq-list">
          @for (faq of filteredFAQs; track faq.id) {
            <div class="faq-item" [class.open]="faq.isOpen">
              <button class="faq-question" (click)="toggleFAQ(faq)">
                <span>{{ faq.question }}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" [class.rotated]="faq.isOpen">
                  <path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6-6-6z" fill="currentColor"/>
                </svg>
              </button>
              <div class="faq-answer" [class.visible]="faq.isOpen">
                <p>{{ faq.answer }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .faq-section {
      padding: 4rem 0;
      background: #f8f9fa;
    }
    .faq-search {
      margin: 2rem 0;
    }
    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }
    .faq-list {
      max-width: 800px;
      margin: 0 auto;
    }
    .faq-item {
      margin-bottom: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .faq-question {
      width: 100%;
      padding: 1.5rem;
      text-align: left;
      background: none;
      border: none;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .faq-question svg {
      transition: transform 0.3s ease;
    }
    .faq-question svg.rotated {
      transform: rotate(180deg);
    }
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .faq-answer.visible {
      max-height: 200px;
      padding: 0 1.5rem 1.5rem;
    }
    .faq-answer p {
      color: #666;
      line-height: 1.6;
    }
  `]
})
export class FaqComponent {
  @Input() searchable = false;
  @Output() questionClicked = new EventEmitter<string>();

  searchTerm = '';

  faqs: FAQ[] = [
    {
      id: '1',
      question: 'How does UnravelDocs work?',
      answer: 'UnravelDocs provides a collaborative platform for creating, editing, and publishing documentation. Teams can work together in real-time with version control and beautiful publishing options.',
      isOpen: false
    },
    {
      id: '2',
      question: 'Is there a free plan available?',
      answer: 'Yes! We offer a generous free plan that includes basic features for small teams. You can upgrade anytime to access advanced features and increased limits.',
      isOpen: false
    },
    {
      id: '3',
      question: 'Can I import existing documentation?',
      answer: 'Absolutely! UnravelDocs supports importing from various formats including Markdown, Word documents, and other popular documentation platforms.',
      isOpen: false
    },
    {
      id: '4',
      question: 'How secure is my data?',
      answer: 'We take security seriously with enterprise-grade encryption, regular backups, and compliance with industry standards. Your data is always protected.',
      isOpen: false
    },
    {
      id: '5',
      question: 'Do you offer customer support?',
      answer: 'Yes! We provide comprehensive support including documentation, tutorials, and direct customer support for all paid plans.',
      isOpen: false
    }
  ];

  filteredFAQs = [...this.faqs];

  toggleFAQ(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
    this.questionClicked.emit(faq.id);
  }

  filterFAQs(): void {
    if (!this.searchTerm.trim()) {
      this.filteredFAQs = [...this.faqs];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredFAQs = this.faqs.filter(faq =>
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term)
    );
  }
}
