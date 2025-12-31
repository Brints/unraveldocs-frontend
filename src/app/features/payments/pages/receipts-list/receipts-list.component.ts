import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentStateService } from '../../services/payment-state.service';
import { Receipt } from '../../models/payment.model';

@Component({
  selector: 'app-receipts-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './receipts-list.component.html',
  styleUrls: ['./receipts-list.component.css']
})
export class ReceiptsListComponent implements OnInit {
  protected readonly paymentState = inject(PaymentStateService);

  // Local state
  showDetailModal = signal(false);

  // From state service
  readonly receipts = this.paymentState.receipts;
  readonly selectedReceipt = this.paymentState.selectedReceipt;
  readonly isLoading = this.paymentState.isLoading;
  readonly isProcessing = this.paymentState.isProcessing;
  readonly error = this.paymentState.error;

  ngOnInit(): void {
    this.paymentState.loadReceipts();
  }

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

  // Helpers
  formatAmount(amount: number, currency: string): string {
    const divisor = currency === 'NGN' ? 100 : 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / divisor);
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

  getProviderClass(provider: string): string {
    return provider === 'stripe' ? 'provider-stripe' : 'provider-paystack';
  }

  getProviderName(provider: string): string {
    return provider === 'stripe' ? 'Stripe' : 'Paystack';
  }
}

