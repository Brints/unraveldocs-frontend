import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentStateService } from '../../services/payment-state.service';
import { PaymentMethod } from '../../models/payment.model';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.css']
})
export class PaymentMethodsComponent implements OnInit {
  protected readonly paymentState = inject(PaymentStateService);

  // Local state
  showAddModal = signal(false);
  showDeleteModal = signal(false);
  methodToDelete = signal<PaymentMethod | null>(null);

  // From state service
  readonly paymentMethods = this.paymentState.paymentMethods;
  readonly defaultPaymentMethod = this.paymentState.defaultPaymentMethod;
  readonly isLoading = this.paymentState.isLoading;
  readonly isProcessing = this.paymentState.isProcessing;
  readonly error = this.paymentState.error;
  readonly successMessage = this.paymentState.successMessage;

  ngOnInit(): void {
    this.paymentState.loadPaymentMethods();
  }

  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  setAsDefault(method: PaymentMethod): void {
    if (!method.isDefault) {
      this.paymentState.setDefaultPaymentMethod(method.id);
    }
  }

  confirmDelete(method: PaymentMethod): void {
    this.methodToDelete.set(method);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.methodToDelete.set(null);
  }

  deleteMethod(): void {
    const method = this.methodToDelete();
    if (method) {
      this.paymentState.removePaymentMethod(method.id);
      this.closeDeleteModal();
    }
  }

  // Helpers
  getCardIcon(brand?: string): string {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'M11.667 12.3333L12.5 10.5L13.3333 12.3333H11.667ZM4 6H20V18H4V6ZM12 8.5C11.1716 8.5 10.5 9.17157 10.5 10C10.5 10.8284 11.1716 11.5 12 11.5C12.8284 11.5 13.5 10.8284 13.5 10C13.5 9.17157 12.8284 8.5 12 8.5Z';
      case 'mastercard':
        return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z';
      default:
        return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
    }
  }

  getCardBrandName(brand?: string): string {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'Amex';
      case 'discover': return 'Discover';
      default: return 'Card';
    }
  }

  getCardBrandClass(brand?: string): string {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'brand-visa';
      case 'mastercard': return 'brand-mastercard';
      case 'amex': return 'brand-amex';
      default: return 'brand-default';
    }
  }

  formatExpiry(month?: number, year?: number): string {
    if (!month || !year) return '—';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  }

  isExpiringSoon(month?: number, year?: number): boolean {
    if (!month || !year) return false;
    const now = new Date();
    const expiry = new Date(year, month - 1);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiry <= threeMonths && expiry >= now;
  }

  isExpired(month?: number, year?: number): boolean {
    if (!month || !year) return false;
    const now = new Date();
    const expiry = new Date(year, month - 1);
    return expiry < now;
  }
}

