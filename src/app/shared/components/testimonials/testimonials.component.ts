import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Testimonial } from './testimonials';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'testimonials.component.html',
  styleUrl: 'testimonials.component.css',
})
export class TestimonialsComponent {
  testimonials = Testimonial;
}
