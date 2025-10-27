import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'pricing.component.html',
  styleUrl: 'pricing.component.css',
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
        'Email support',
      ],
      buttonText: 'Get Started Free',
      popular: false,
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
        'Premium support',
      ],
      buttonText: 'Start Pro Trial',
      popular: true,
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
        'Advanced security',
      ],
      buttonText: 'Contact Sales',
      popular: false,
    },
  ];

  selectPlan(plan: any) {
    console.log('Selected plan:', plan.name);
  }
}
