import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserStateService } from '../../services/user-state.service';
import { UserApiService } from '../../services/user-api.service';
import { PaymentMethod, Invoice, Subscription } from '../../models/user.model';

@Component({
  selector: 'app-billing-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-settings.component.html',
  styleUrls: ['./billing-settings.component.css']
})
export class BillingSettingsComponent implements OnInit {
  private readonly userState = inject(UserStateService);
  private readonly userApi = inject(UserApiService);

  // State
  readonly subscription = this.userState.subscription;
  readonly subscriptionStatus = this.userState.subscriptionStatus;

  paymentMethods = signal<PaymentMethod[]>([]);
  invoices = signal<Invoice[]>([]);
  isLoadingPayments = signal(true);
  isLoadingInvoices = signal(true);

  // Plan options for display
  readonly plans = [
    {
      id: 'FREE',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['5 documents/month', '25 OCR pages', '1GB storage', 'Basic support'],
      popular: false
    },
    {
      id: 'STARTER',
      name: 'Starter',
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: ['30 documents/month', '150 OCR pages', '5GB storage', 'Email support'],
      popular: false
    },
    {
      id: 'PRO',
      name: 'Pro',
      monthlyPrice: 19,
      yearlyPrice: 190,
      features: ['100 documents/month', '500 OCR pages', '20GB storage', 'Priority support', 'API access'],
      popular: true
    },
    {
      id: 'BUSINESS',
      name: 'Business',
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: ['500 documents/month', '2500 OCR pages', '100GB storage', '24/7 support', 'API access', 'Team features'],
      popular: false
    }
  ];

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.loadInvoices();
  }

  private loadPaymentMethods(): void {
    this.isLoadingPayments.set(true);

    // Mock data
    setTimeout(() => {
      this.paymentMethods.set([
        {
          id: 'pm_1',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2027,
          isDefault: true
        },
        {
          id: 'pm_2',
          type: 'card',
          brand: 'mastercard',
          last4: '8888',
          expiryMonth: 6,
          expiryYear: 2026,
          isDefault: false
        }
      ]);
      this.isLoadingPayments.set(false);
    }, 1000);
  }

  private loadInvoices(): void {
    this.isLoadingInvoices.set(true);

    // Mock data
    setTimeout(() => {
      this.invoices.set([
        {
          id: 'inv_1',
          number: 'INV-2024-001',
          amount: 9.00,
          currency: 'USD',
          status: 'paid',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          pdfUrl: '#',
          items: [{ description: 'Starter Plan - Monthly', quantity: 1, unitPrice: 9, total: 9 }]
        },
        {
          id: 'inv_2',
          number: 'INV-2023-012',
          amount: 9.00,
          currency: 'USD',
          status: 'paid',
          date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          pdfUrl: '#',
          items: [{ description: 'Starter Plan - Monthly', quantity: 1, unitPrice: 9, total: 9 }]
        },
        {
          id: 'inv_3',
          number: 'INV-2023-011',
          amount: 9.00,
          currency: 'USD',
          status: 'paid',
          date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
          pdfUrl: '#',
          items: [{ description: 'Starter Plan - Monthly', quantity: 1, unitPrice: 9, total: 9 }]
        }
      ]);
      this.isLoadingInvoices.set(false);
    }, 1200);
  }

  setDefaultPaymentMethod(paymentMethodId: string): void {
    this.paymentMethods.update(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === paymentMethodId }))
    );
    // API call would go here
  }

  removePaymentMethod(paymentMethodId: string): void {
    this.paymentMethods.update(methods =>
      methods.filter(m => m.id !== paymentMethodId)
    );
    // API call would go here
  }

  getCardBrandIcon(brand: string): string {
    // Return appropriate icon path based on brand
    const icons: Record<string, string> = {
      'visa': 'M3 10h2l.5-2h3l.5 2h2l-1-4h-2l-.5 2h-1l-.5-2h-2l-1 4zm10 0h2l1-4h-2l-1 4zm4-2a2 2 0 104 0 2 2 0 00-4 0z',
      'mastercard': 'M16 12a4 4 0 11-8 0 4 4 0 018 0zm-4-2a2 2 0 100 4 2 2 0 000-4z',
      'amex': 'M3 10h18v4H3v-4z',
      'default': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    };
    return icons[brand.toLowerCase()] || icons['default'];
  }

  getCardBrandName(brand: string): string {
    const names: Record<string, string> = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'amex': 'American Express',
      'discover': 'Discover'
    };
    return names[brand.toLowerCase()] || brand;
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCurrentPlan() {
    const sub = this.subscription();
    return this.plans.find(p => p.id === sub?.planName) || this.plans[0];
  }

  isCurrentPlan(planId: string): boolean {
    return this.subscription()?.planName === planId;
  }

  canUpgrade(planId: string): boolean {
    const currentIndex = this.plans.findIndex(p => p.id === this.subscription()?.planName);
    const targetIndex = this.plans.findIndex(p => p.id === planId);
    return targetIndex > currentIndex;
  }
}

