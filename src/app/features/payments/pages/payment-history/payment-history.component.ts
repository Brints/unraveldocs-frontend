import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentStateService } from '../../services/payment-state.service';
import { Payment, PaymentStatus, PaymentProvider } from '../../models/payment.model';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit {
  protected readonly paymentState = inject(PaymentStateService);
  private readonly router = inject(Router);

  // Local state
  searchQuery = signal('');
  statusFilter = signal<PaymentStatus | ''>('');
  providerFilter = signal<PaymentProvider | ''>('');
  showDetailModal = signal(false);

  // From state service
  readonly payments = this.paymentState.payments;
  readonly filteredPayments = this.paymentState.filteredPayments;
  readonly selectedPayment = this.paymentState.selectedPayment;
  readonly isLoading = this.paymentState.isLoading;
  readonly error = this.paymentState.error;
  readonly successMessage = this.paymentState.successMessage;
  readonly totalPayments = this.paymentState.totalPayments;
  readonly totalAmount = this.paymentState.totalAmount;
  readonly successfulPayments = this.paymentState.successfulPayments;
  readonly failedPayments = this.paymentState.failedPayments;

  ngOnInit(): void {
    this.paymentState.loadAllPaymentData();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.paymentState.updateFilter({ searchQuery: value });
  }

  onStatusFilter(status: PaymentStatus | ''): void {
    this.statusFilter.set(status);
    this.paymentState.updateFilter({ status: status || undefined });
  }

  onProviderFilter(provider: PaymentProvider | ''): void {
    this.providerFilter.set(provider);
    this.paymentState.updateFilter({ provider: provider || undefined });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.providerFilter.set('');
    this.paymentState.clearFilter();
  }

  viewPaymentDetail(payment: Payment): void {
    this.paymentState.selectPayment(payment);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.paymentState.selectPayment(null);
  }

  viewReceipt(paymentReference: string): void {
    // Payment reference (PAY_xxx) is not the same as receipt number (REC-xxx)
    // Navigate to receipts page where user can find their receipt
    this.router.navigate(['/payments/receipts']);
  }

  // Helpers
  formatAmount(amount: number, currency: string): string {
    // Paystack stores amounts in kobo (smallest currency unit)
    // Divide by 100 to get the main currency unit
    const mainAmount = amount / 100;

    // Use custom symbols for currencies not well supported by Intl
    const currencySymbols: Record<string, string> = {
      'NGN': '₦',
      'GHS': '₵',
      'ZAR': 'R',
      'KES': 'KSh',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };

    const symbol = currencySymbols[currency] || currency + ' ';
    return `${symbol}${mainAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'succeeded': return 'status-succeeded';
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'failed': return 'status-failed';
      case 'refunded': return 'status-refunded';
      case 'canceled': return 'status-canceled';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case 'succeeded': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'pending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'processing': return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
      case 'failed': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'refunded': return 'M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z';
      default: return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getProviderIcon(provider: PaymentProvider): string {
    return provider === 'stripe' ? 'Stripe' : 'Paystack';
  }

  getCardBrandIcon(brand?: string): string {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'MC';
      case 'amex': return 'AMEX';
      default: return 'CARD';
    }
  }
}

