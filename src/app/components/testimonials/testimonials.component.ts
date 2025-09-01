import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20">
          <h2 class="section-title">Trusted by Professionals Worldwide</h2>
          <p class="section-subtitle">
            See what our users have to say about their UnravelDocs experience
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="testimonial-card" *ngFor="let testimonial of testimonials; let i = index">
            <!-- Star Rating -->
            <div class="flex gap-1 mb-6">
              <svg *ngFor="let star of [1,2,3,4,5]" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>

            <blockquote class="text-gray-700 text-lg leading-relaxed mb-6 italic">
              "{{ testimonial.text }}"
            </blockquote>

            <div class="flex items-center gap-4">
              <div class="author-avatar">
                {{ testimonial.author.charAt(0) }}
              </div>
              <div>
                <div class="font-semibold text-gray-900">{{ testimonial.author }}</div>
                <div class="text-gray-600 text-sm">{{ testimonial.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .testimonial-card {
      @apply bg-white p-8 rounded-2xl shadow-lg border border-gray-100
             transition-all duration-300 hover:-translate-y-2 hover:shadow-xl;
      animation: fadeInUp 0.6s ease forwards;
      opacity: 0;
      transform: translateY(30px);
    }

    .testimonial-card:nth-child(1) { animation-delay: 0.1s; }
    .testimonial-card:nth-child(2) { animation-delay: 0.2s; }
    .testimonial-card:nth-child(3) { animation-delay: 0.3s; }
    .testimonial-card:nth-child(4) { animation-delay: 0.4s; }
    .testimonial-card:nth-child(5) { animation-delay: 0.5s; }
    .testimonial-card:nth-child(6) { animation-delay: 0.6s; }

    .author-avatar {
      @apply w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700
             rounded-full flex items-center justify-center text-white font-bold;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class TestimonialsComponent {
  testimonials = [
    {
      text: "UnravelDocs has revolutionized how I handle document digitization. The accuracy is incredible, and it saves me hours of manual typing every week.",
      author: "Sarah Johnson",
      role: "Research Assistant"
    },
    {
      text: "As a lawyer, I deal with tons of scanned documents. UnravelDocs makes it easy to convert them to editable formats quickly and accurately.",
      author: "Michael Chen",
      role: "Legal Professional"
    },
    {
      text: "The interface is intuitive and the results are consistently excellent. It's become an essential tool for our document management workflow.",
      author: "Emily Rodriguez",
      role: "Office Manager"
    },
    {
      text: "I was amazed by how well it handles handwritten notes. It even recognized my terrible handwriting better than I expected!",
      author: "David Kim",
      role: "Graduate Student"
    },
    {
      text: "The batch processing feature is a game-changer. I can process multiple documents at once and get professional results every time.",
      author: "Lisa Thompson",
      role: "Administrative Coordinator"
    },
    {
      text: "Fast, accurate, and secure. UnravelDocs has made digitizing our company's paper archives so much easier.",
      author: "Robert Martinez",
      role: "IT Manager"
    }
  ];
}
