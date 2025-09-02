import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20">
          <h2 class="section-title">Choose Your Plan</h2>
          <p class="section-subtitle">
            Start free and upgrade as your needs grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div class="pricing-card group" *ngFor="let plan of plans; let i = index"
               [class.popular]="plan.popular">
            <div class="plan-badge" *ngIf="plan.popular">Most Popular</div>

            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ plan.name }}</h3>
              <div class="flex items-baseline justify-center gap-1 mb-4">
                <span class="text-lg text-gray-500">$</span>
                <span class="text-5xl font-bold text-gray-900">{{ plan.price }}</span>
                <span class="text-gray-500">/{{ plan.period }}</span>
              </div>
              <p class="text-gray-600 leading-relaxed">{{ plan.description }}</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li *ngFor="let feature of plan.features" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="text-gray-700">{{ feature }}</span>
              </li>
            </ul>

            <button class="plan-button w-full" [class.primary]="plan.popular" (click)="selectPlan(plan)">
              {{ plan.buttonText }}
            </button>
          </div>
        </div>

        <div class="text-center mt-16">
          <p class="text-gray-600">All plans include 24/7 support and 99.9% uptime guarantee</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .pricing-card {
      @apply bg-white border-2 border-gray-200 rounded-3xl p-8 relative
             transition-all duration-300 hover:-translate-y-2 hover:shadow-xl;
    }

    .pricing-card.popular {
      @apply border-blue-500 shadow-lg transform scale-105;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.15);
    }

    .pricing-card.popular:hover {
      transform: scale(1.05) translateY(-8px);
    }

    .plan-badge {
      @apply absolute -top-4 left-1/2 transform -translate-x-1/2
             bg-gradient-to-r from-blue-500 to-blue-700 text-white
             px-6 py-2 rounded-full text-sm font-semibold;
    }

    .plan-button {
      @apply py-4 px-6 rounded-xl font-semibold transition-all duration-300
             border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:-translate-y-1;
    }

    .plan-button.primary {
      @apply bg-gradient-to-r from-blue-500 to-blue-700 text-white border-blue-500
             shadow-lg hover:shadow-xl;
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
    }

    .plan-button.primary:hover {
      box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
    }
  `]
})
export class PricingComponent {
  plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Perfect for getting started with basic document conversion',
      features: [
        '5 documents per month',
        'Basic OCR accuracy',
        'Standard processing speed',
        'DOCX export',
        'Email support'
      ],
      buttonText: 'Get Started Free',
      popular: false
    },
    {
      name: 'Pro',
      price: '9',
      period: 'month',
      description: 'Ideal for professionals and small businesses',
      features: [
        '100 documents per month',
        'Advanced AI OCR',
        'Priority processing',
        'Multiple export formats',
        'Batch processing',
        'Premium support'
      ],
      buttonText: 'Start Pro Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '29',
      period: 'month',
      description: 'For large teams and organizations',
      features: [
        'Unlimited documents',
        'Highest accuracy AI',
        'Instant processing',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Advanced security'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  selectPlan(plan: any) {
    console.log('Selected plan:', plan.name);
  }
}

