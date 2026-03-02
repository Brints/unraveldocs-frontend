import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentStateService } from '../../services/payment-state.service';
import { Receipt } from '../../models/payment.model';
import { catchError, of, forkJoin, tap, finalize } from 'rxjs';

interface ProviderInfo {
  name: string;
  cssClass: string;
  iconBg: string;
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

const CURRENCY_PREF_KEY = 'unraveldocs_receipt_currency';
const PAGE_SIZE = 10;

import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-receipts-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePickerComponent],
  templateUrl: './receipts-list.component.html',
  styleUrls: ['./receipts-list.component.css']
})
export class ReceiptsListComponent implements OnInit {
  protected readonly paymentState = inject(PaymentStateService);

  // Local state
  showDetailModal = signal(false);
  showDeleteConfirm = signal(false);
  deleteTarget = signal<string | null>(null); // single receipt number to delete
  searchQuery = signal('');
  providerFilter = signal<string>('all');
  currencyFilter = signal<string>('all');
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');
  selectedCurrency = signal<string>(this.getInitialCurrency());

  // Bulk selection
  selectionMode = signal(false);
  selectedReceipts = signal<Set<string>>(new Set());

  // Pagination
  currentPage = signal(0);
  pageSize = signal(PAGE_SIZE);

  private getInitialCurrency(): string {
    try {
      return localStorage.getItem('preferredCurrency') || 'USD';
    } catch {
      return 'USD';
    }
  }

  // From state service
  readonly receipts = this.paymentState.receipts;
  readonly selectedReceipt = this.paymentState.selectedReceipt;
  readonly isLoading = this.paymentState.isLoading;
  readonly isProcessing = this.paymentState.isProcessing;
  readonly error = this.paymentState.error;
  readonly successMessage = this.paymentState.successMessage;
  readonly receiptPagination = this.paymentState.receiptPagination;

  // Selection helpers
  readonly selectedCount = computed(() => this.selectedReceipts().size);
  readonly allOnPageSelected = computed(() => {
    const receipts = this.filteredReceipts();
    const selected = this.selectedReceipts();
    return receipts.length > 0 && receipts.every(r => selected.has(r.receiptNumber));
  });

  // Available currencies derived from receipts
  readonly availableCurrencies = computed(() => {
    const currencies = new Set<string>();
    this.receipts().forEach(r => currencies.add(r.currency));
    return Array.from(currencies).sort();
  });

  // Filtered receipts (client-side search + provider + currency + date)
  readonly filteredReceipts = computed(() => {
    let list = this.receipts();
    const query = this.searchQuery().toLowerCase().trim();
    const provider = this.providerFilter();
    const currency = this.currencyFilter();
    const startDate = this.startDateFilter();
    const endDate = this.endDateFilter();

    if (provider !== 'all') {
      list = list.filter(r => r.paymentProvider.toLowerCase() === provider.toLowerCase());
    }

    if (currency !== 'all') {
      list = list.filter(r => r.currency === currency);
    }

    if (startDate) {
      list = list.filter(r => new Date(r.paidAt) >= new Date(startDate));
    }

    if (endDate) {
      // Set to end of the day for inclusive filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(r => new Date(r.paidAt) <= end);
    }

    if (query) {
      list = list.filter(r =>
        r.receiptNumber.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.paymentMethodDetails?.toLowerCase().includes(query) ||
        r.paymentMethod?.toLowerCase().includes(query) ||
        this.getProviderInfo(r.paymentProvider).name.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Summary stats
  readonly totalReceipts = computed(() => {
    const pagination = this.receiptPagination();
    return pagination.totalElements || this.receipts().length;
  });

  // Group totals by currency — show all supported currencies
  readonly currencyTotals = computed((): CurrencyTotal[] => {
    const receipts = this.receipts();
    const totalsMap = new Map<string, number>();
    for (const r of receipts) {
      totalsMap.set(r.currency, (totalsMap.get(r.currency) || 0) + r.amount);
    }
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

  readonly latestReceiptDate = computed(() => {
    const receipts = this.receipts();
    if (receipts.length === 0) return 'No receipts';
    const latest = receipts.reduce((max, r) =>
      new Date(r.paidAt) > new Date(max.paidAt) ? r : max
    );
    return this.formatDate(latest.paidAt);
  });

  // Pagination computed
  readonly totalPages = computed(() => {
    return this.receiptPagination().totalPages || 1;
  });

  readonly isFirstPage = computed(() => this.currentPage() === 0);
  readonly isLastPage = computed(() => {
    const pagination = this.receiptPagination();
    return this.currentPage() >= (pagination.totalPages - 1);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push(-1); // ellipsis

      const start = Math.max(1, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 3) pages.push(-1); // ellipsis
      pages.push(total - 1);
    }
    return pages;
  });

  // Provider info map
  private readonly providerMap: Record<string, ProviderInfo> = {
    stripe: {
      name: 'Stripe',
      cssClass: 'provider-stripe',
      iconBg: '#e0e7ff',
      accentColor: '#6366f1',
    },
    paypal: {
      name: 'PayPal',
      cssClass: 'provider-paypal',
      iconBg: '#dbeafe',
      accentColor: '#2563eb',
    },
    paystack: {
      name: 'Paystack',
      cssClass: 'provider-paystack',
      iconBg: '#d1fae5',
      accentColor: '#059669',
    },
  };

  ngOnInit(): void {
    this.paymentState.loadReceipts(0, this.pageSize());
  }

  // ==================== Pagination ====================

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.paymentState.loadReceipts(page, this.pageSize());
  }

  nextPage(): void {
    if (!this.isLastPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (!this.isFirstPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  // ==================== Currency ====================

  onCurrencyFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.currencyFilter.set(value);
  }

  onStartDateFilter(value: string): void {
    this.startDateFilter.set(value);
  }

  onEndDateFilter(value: string): void {
    this.endDateFilter.set(value);
  }

  onCurrencySelect(value: string): void {
    this.selectedCurrency.set(value);
    try {
      localStorage.setItem('preferredCurrency', value);
    } catch {}
  }


  // ==================== Actions ====================

  viewReceipt(receipt: Receipt): void {
    this.paymentState.selectReceipt(receipt);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.paymentState.selectReceipt(null);
  }

  downloadReceipt(receiptNumber: string): void {
    this.paymentState.downloadReceipt(receiptNumber);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onProviderFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.providerFilter.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.providerFilter.set('all');
    this.currencyFilter.set('all');
    this.startDateFilter.set('');
    this.endDateFilter.set('');
  }

  exportToCsv(): void {
    const receipts = this.filteredReceipts();
    if (!receipts.length) return;

    const headers = ['Date', 'Receipt Number', 'Description', 'Provider', 'Amount', 'Currency', 'Payment Method', 'Method Details'];
    const rows = receipts.map(r => [
      new Date(r.paidAt).toISOString(),
      r.receiptNumber || '',
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.paymentProvider,
      r.amount.toString(),
      r.currency,
      r.paymentMethod || '',
      `"${(r.paymentMethodDetails || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==================== Delete ====================

  confirmDeleteReceipt(receiptNumber: string, event?: Event): void {
    event?.stopPropagation();
    this.deleteTarget.set(receiptNumber);
    this.showDeleteConfirm.set(true);
  }

  confirmBulkDelete(): void {
    this.deleteTarget.set(null); // null means bulk
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (target) {
      // Single delete
      this.paymentState.deleteReceipt(target);
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
      // Close detail modal if it was open for this receipt
      if (this.selectedReceipt()?.receiptNumber === target) {
        this.closeDetailModal();
      }
    } else {
      // Bulk delete
      const numbers = Array.from(this.selectedReceipts());
      if (numbers.length > 0) {
        this.paymentState.bulkDeleteReceipts(numbers);
        this.showDeleteConfirm.set(false);
        this.selectedReceipts.set(new Set());
        this.selectionMode.set(false);
      }
    }
  }

  // ==================== Selection ====================

  toggleSelectionMode(): void {
    const entering = !this.selectionMode();
    this.selectionMode.set(entering);
    if (!entering) {
      this.selectedReceipts.set(new Set());
    }
  }

  toggleReceiptSelection(receiptNumber: string, event: Event): void {
    event.stopPropagation();
    this.selectedReceipts.update(set => {
      const next = new Set(set);
      if (next.has(receiptNumber)) {
        next.delete(receiptNumber);
      } else {
        next.add(receiptNumber);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    const receipts = this.filteredReceipts();
    const selected = this.selectedReceipts();
    if (receipts.every(r => selected.has(r.receiptNumber))) {
      // Deselect all on page
      this.selectedReceipts.update(set => {
        const next = new Set(set);
        receipts.forEach(r => next.delete(r.receiptNumber));
        return next;
      });
    } else {
      // Select all on page
      this.selectedReceipts.update(set => {
        const next = new Set(set);
        receipts.forEach(r => next.add(r.receiptNumber));
        return next;
      });
    }
  }

  isReceiptSelected(receiptNumber: string): boolean {
    return this.selectedReceipts().has(receiptNumber);
  }

  getDeleteMessage(): string {
    const target = this.deleteTarget();
    if (target) {
      return `Are you sure you want to delete receipt ${target}? This action cannot be undone.`;
    }
    const count = this.selectedCount();
    return `Are you sure you want to delete ${count} receipt${count > 1 ? 's' : ''}? This action cannot be undone.`;
  }

  // ==================== Provider helpers ====================

  getProviderInfo(provider: string): ProviderInfo {
    const key = provider.toLowerCase();
    return this.providerMap[key] || {
      name: provider,
      cssClass: 'provider-default',
      iconBg: '#f3f4f6',
      accentColor: '#6b7280',
    };
  }

  getProviderClass(provider: string): string {
    return this.getProviderInfo(provider).cssClass;
  }

  getProviderName(provider: string): string {
    return this.getProviderInfo(provider).name;
  }

  // ==================== Format helpers ====================

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatCurrencyValue(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPaymentMethod(receipt: Receipt): string {
    if (receipt.paymentMethodDetails) {
      return receipt.paymentMethodDetails;
    }
    if (receipt.paymentMethod) {
      return receipt.paymentMethod.replace(/_/g, ' ');
    }
    return 'N/A';
  }

  getPaymentMethodIcon(method?: string): string {
    if (!method) return 'generic';
    const m = method.toLowerCase();
    if (m.includes('card') || m.includes('visa') || m.includes('mastercard')) return 'card';
    if (m.includes('bank')) return 'bank';
    if (m.includes('paypal')) return 'paypal';
    return 'generic';
  }

  getCurrencySymbol(currency: string): string {
    try {
      const parts = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).formatToParts(0);
      return parts.find(p => p.type === 'currency')?.value || currency;
    } catch {
      return currency;
    }
  }
}
