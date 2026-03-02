import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentStateService } from '../../services/payment-state.service';
import { Payment, PaymentStatus, PaymentProvider } from '../../models/payment.model';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';

interface ProviderInfo {
  name: string;
  cssClass: string;
  accentColor: string;
}

interface CurrencyTotal {
  code: string;
  symbol: string;
  name: string;
  amount: number;
  formatted: string;
}

const SUPPORTED_CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
];

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePickerComponent],
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
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');
  selectedCurrency = signal<string>(this.getInitialCurrency());
  showDetailModal = signal(false);

  private getInitialCurrency(): string {
    try {
      return localStorage.getItem('preferredCurrency') || 'USD';
    } catch {
      return 'USD';
    }
  }

  // From state service
  readonly payments = this.paymentState.payments;
  readonly filteredPayments = this.paymentState.filteredPayments;
  readonly selectedPayment = this.paymentState.selectedPayment;
  readonly isLoading = this.paymentState.isLoading;
  readonly error = this.paymentState.error;
  readonly successMessage = this.paymentState.successMessage;
  readonly totalPayments = this.paymentState.totalPayments;
  readonly successfulPayments = this.paymentState.successfulPayments;
  readonly failedPayments = this.paymentState.failedPayments;
  readonly hasMorePayments = this.paymentState.hasMorePayments;

  // Totals broken down by currency
  readonly currencyTotals = computed((): CurrencyTotal[] => {
    const totalsMap = this.paymentState.totalsByCurrency();
    return SUPPORTED_CURRENCIES.map(c => {
      const amount = totalsMap.get(c.code) || 0;
      return {
        ...c,
        amount,
        formatted: `${c.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    });
  });

  // Active currency total for the stats display
  readonly activeCurrencyTotal = computed(() => {
    const code = this.selectedCurrency();
    const totals = this.currencyTotals();
    const active = totals.find(c => c.code === code);
    return active || totals[0];
  });

  // Provider map
  private readonly providerMap: Record<string, ProviderInfo> = {
    stripe: { name: 'Stripe', cssClass: 'provider-stripe', accentColor: '#6366f1' },
    paypal: { name: 'PayPal', cssClass: 'provider-paypal', accentColor: '#2563eb' },
    paystack: { name: 'Paystack', cssClass: 'provider-paystack', accentColor: '#059669' },
  };

  ngOnInit(): void {
    this.paymentState.loadAllPaymentData();
  }

  // ==================== Filters ====================

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

  onStartDateFilter(value: string): void {
    this.startDateFilter.set(value);
    this.paymentState.updateFilter({ dateFrom: value || undefined });
  }

  onEndDateFilter(value: string): void {
    this.endDateFilter.set(value);
    this.paymentState.updateFilter({ dateTo: value || undefined });
  }

  onCurrencySelect(value: string): void {
    this.selectedCurrency.set(value);
    try {
      localStorage.setItem('preferredCurrency', value);
    } catch {}
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.providerFilter.set('');
    this.startDateFilter.set('');
    this.endDateFilter.set('');
    this.paymentState.clearFilter();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.paymentState.updateFilter({ searchQuery: '' });
  }

  // ==================== Actions ====================

  viewPaymentDetail(payment: Payment): void {
    this.paymentState.selectPayment(payment);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.paymentState.selectPayment(null);
  }

  viewReceipt(paymentReference: string): void {
    this.router.navigate(['/payments/receipts']);
  }

  loadMore(): void {
    this.paymentState.loadMorePayments();
  }

  exportToCsv(): void {
    const payments = this.filteredPayments();
    if (!payments.length) return;

    const headers = ['Date', 'Receipt Number', 'Description', 'Provider', 'Amount', 'Currency', 'Status', 'Payment Method'];
    const rows = payments.map(p => [
      new Date(p.createdAt).toISOString(),
      p.receiptNumber || '',
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.provider,
      p.amount.toString(),
      p.currency,
      p.status,
      `${this.getProviderName(p.provider)} ${p.paymentMethodLast4 ? '...' + p.paymentMethodLast4 : ''}`.trim()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==================== Provider helpers ====================

  getProviderInfo(provider: string): ProviderInfo {
    const key = provider.toLowerCase();
    return this.providerMap[key] || { name: provider, cssClass: 'provider-default', accentColor: '#6b7280' };
  }

  getProviderName(provider: string): string {
    return this.getProviderInfo(provider).name;
  }

  getProviderClass(provider: string): string {
    return this.getProviderInfo(provider).cssClass;
  }

  getProviderAccentClass(provider: string): string {
    return `accent-${provider.toLowerCase()}`;
  }

  getProviderIconClass(provider: string): string {
    return `icon-${provider.toLowerCase()}`;
  }

  // ==================== Format helpers ====================

  formatAmount(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ==================== Status helpers ====================

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

  getStatusLabel(status: PaymentStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // ==================== Card helpers ====================

  getCardBrandIcon(brand?: string): string {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'MC';
      case 'amex': return 'AMEX';
      default: return 'CARD';
    }
  }
}

