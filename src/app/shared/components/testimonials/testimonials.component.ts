import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Testimonials} from './testimonials';

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

  testimonials: Testimonial[] = Testimonials

  onTestimonialClick(testimonialId: string): void {
    this.testimonialClicked.emit(testimonialId);
  }
}
