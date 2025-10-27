import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  id: string;
  text: string;
  author: string;
  role: string;
  company?: string;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent {
  @Input() autoplay = false;
  @Output() testimonialClicked = new EventEmitter<string>();

  testimonials: Testimonial[] = [
    {
      id: '1',
      text: 'UnravelDocs has revolutionized how we handle document digitization. The accuracy is incredible and saves us hours of manual work.',
      author: 'Sarah Chen',
      role: 'Operations Manager',
      company: 'TechCorp'
    },
    {
      id: '2',
      text: 'As a lawyer, I deal with tons of handwritten documents. This tool extracts text with amazing precision, making my work so much easier.',
      author: 'Michael Rodriguez',
      role: 'Senior Attorney',
      company: 'Legal Partners'
    },
    {
      id: '3',
      text: 'The API integration was seamless and the processing speed is fantastic. Our document workflow is now completely automated.',
      author: 'Emma Thompson',
      role: 'CTO',
      company: 'StartupXYZ'
    },
    {
      id: '4',
      text: 'I use this for my research papers and historical documents. The OCR quality is outstanding, even with old manuscripts.',
      author: 'Dr. James Wilson',
      role: 'Research Historian',
      company: 'University of Cambridge'
    },
    {
      id: '5',
      text: 'Customer support is excellent and the pricing is fair. This tool has become essential for our document management.',
      author: 'Lisa Park',
      role: 'Document Specialist',
      company: 'Global Enterprises'
    },
    {
      id: '6',
      text: 'The multilingual support is impressive. We process documents in 12 different languages with consistent accuracy.',
      author: 'Roberto Silva',
      role: 'IT Director',
      company: 'International Corp'
    }
  ];

  onTestimonialClick(testimonialId: string): void {
    this.testimonialClicked.emit(testimonialId);
  }
}
