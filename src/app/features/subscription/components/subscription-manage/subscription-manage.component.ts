import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionStateService } from '../../services/subscription-state.service';
import { Invoice, PaymentMethod } from '../../models/subscription.model';

@Component({
  selector: 'app-subscription-manage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-manage.component.html',
  styleUrls: ['./subscription-manage.component.css']
})
export class SubscriptionManageComponent implements OnInit {
  protected readonly subState = inject(SubscriptionStateService);

  // Local state
  activeTab = signal<'overview' | 'usage' | 'billing' | 'invoices'>('overview');
  showCancelModal = signal(false);
  cancelImmediately = signal(false);

  // From state service
  readonly currentSubscription = this.subState.currentSubscription;
  readonly currentPlan = this.subState.currentPlan;
  readonly currentTier = this.subState.currentTier;
  readonly usage = this.subState.usage;
  readonly paymentMethods = this.subState.paymentMethods;
  readonly invoices = this.subState.invoices;
  readonly isLoading = this.subState.isLoading;
  readonly isProcessing = this.subState.isProcessing;
  readonly error = this.subState.error;
  readonly successMessage = this.subState.successMessage;
  readonly isSubscribed = this.subState.isSubscribed;
  readonly isTrialing = this.subState.isTrialing;
  readonly isCanceled = this.subState.isCanceled;
  readonly trialDaysRemaining = this.subState.trialDaysRemaining;
  readonly daysUntilRenewal = this.subState.daysUntilRenewal;
  readonly defaultPaymentMethod = this.subState.defaultPaymentMethod;
  readonly documentsUsagePercent = this.subState.documentsUsagePercent;
  readonly ocrUsagePercent = this.subState.ocrUsagePercent;
  readonly storageUsagePercent = this.subState.storageUsagePercent;

  ngOnInit(): void {
    this.subState.loadSubscriptionData();
  }

  setActiveTab(tab: 'overview' | 'usage' | 'billing' | 'invoices'): void {
    this.activeTab.set(tab);
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.cancelImmediately.set(false);
  }

  confirmCancel(): void {
    this.subState.cancelSubscription(this.cancelImmediately());
    this.closeCancelModal();
  }

  resumeSubscription(): void {
    this.subState.resumeSubscription();
  }

  setDefaultPaymentMethod(pm: PaymentMethod): void {
    this.subState.setDefaultPaymentMethod(pm.id);
  }

  downloadInvoice(invoice: Invoice): void {
    this.subState.downloadInvoice(invoice.number);
  }

  // Helpers
  formatDate(dateString?: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatLimit(value: number): string {
    if (value < 0) return 'Unlimited';
    return value.toLocaleString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'trialing': return 'status-trialing';
      case 'past_due': return 'status-past-due';
      case 'canceled': return 'status-canceled';
      case 'paused': return 'status-paused';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': return 'Trial';
      case 'past_due': return 'Past Due';
      case 'canceled': return 'Canceled';
      case 'paused': return 'Paused';
      default: return status;
    }
  }

  getCardIcon(brand?: string): string {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'MC';
      case 'amex': return 'AMEX';
      default: return 'CARD';
    }
  }

  getInvoiceStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'invoice-paid';
      case 'open': return 'invoice-open';
      case 'void': return 'invoice-void';
      default: return 'invoice-default';
    }
  }

  getUsageBarClass(percent: number): string {
    if (percent >= 90) return 'usage-critical';
    if (percent >= 70) return 'usage-warning';
    return 'usage-normal';
  }
}

