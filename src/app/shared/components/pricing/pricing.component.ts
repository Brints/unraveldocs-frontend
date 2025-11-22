import { Component, Input, Output, EventEmitter } from '@angular/core';


interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent {
  @Input() highlightPopular = false;
  @Output() planSelected = new EventEmitter<string>();
  @Output() signupCompleted = new EventEmitter<void>();

  plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Perfect for trying out our service',
      features: [
        '5 document conversions per month',
        'Basic text extraction',
        'Standard accuracy',
        'Email support'
      ],
      buttonText: 'Get Started Free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 15,
      period: 'month',
      description: 'Best for professionals and small teams',
      features: [
        '100 document conversions per month',
        'Advanced AI text extraction',
        '99.5% accuracy guarantee',
        'Multiple output formats',
        'Priority support',
        'API access'
      ],
      buttonText: 'Start Pro Trial',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49,
      period: 'month',
      description: 'For large teams and organizations',
      features: [
        'Unlimited document conversions',
        'Premium AI processing',
        'Custom integrations',
        'White-label solution',
        'Dedicated support',
        'SLA guarantee',
        'Advanced analytics'
      ],
      buttonText: 'Contact Sales'
    }
  ];

  selectPlan(plan: PricingPlan) {
    console.log('Selected plan:', plan.name);
    // Handle plan selection logic
  }

  onPlanSelect(planId: string): void {
    this.planSelected.emit(planId);
  }

  onSignupComplete(): void {
    this.signupCompleted.emit();
  }
}
