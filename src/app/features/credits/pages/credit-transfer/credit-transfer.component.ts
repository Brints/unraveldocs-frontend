import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreditStateService } from '../../services/credit-state.service';

@Component({
  selector: 'app-credit-transfer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './credit-transfer.component.html',
  styleUrls: ['./credit-transfer.component.css']
})
export class CreditTransferComponent {
  private readonly creditState = inject(CreditStateService);

  // State
  readonly creditBalance = this.creditState.creditBalance;
  readonly isProcessing = this.creditState.isProcessing;
  readonly error = this.creditState.error;
  readonly successMessage = this.creditState.successMessage;
  readonly lastTransfer = this.creditState.lastTransfer;
  readonly isLoading = this.creditState.isLoading;

  // Form state
  recipientEmail = signal('');
  transferAmount = signal<number | null>(null);
  showConfirmModal = signal(false);

  // Validation
  readonly emailError = computed(() => {
    const email = this.recipientEmail();
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    return null;
  });

  readonly amountError = computed(() => {
    const amount = this.transferAmount();
    const balance = this.creditBalance();
    if (amount === null) return null;
    if (amount <= 0) return 'Amount must be at least 1 credit.';
    if (amount > balance - 5) return `You must retain at least 5 credits. Max transfer: ${Math.max(0, balance - 5)} credits.`;
    return null;
  });

  readonly isFormValid = computed(() => {
    const email = this.recipientEmail();
    const amount = this.transferAmount();
    return email && !this.emailError() && amount && amount > 0 && !this.amountError();
  });

  readonly maxTransferable = computed(() => {
    return Math.max(0, this.creditBalance() - 5);
  });

  ngOnInit(): void {
    this.creditState.loadBalance();
  }

  updateEmail(event: Event): void {
    this.recipientEmail.set((event.target as HTMLInputElement).value);
  }

  updateAmount(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.transferAmount.set(isNaN(value) ? null : value);
  }

  setMaxAmount(): void {
    this.transferAmount.set(this.maxTransferable());
  }

  openConfirmation(): void {
    if (!this.isFormValid()) return;
    this.showConfirmModal.set(true);
  }

  closeConfirmation(): void {
    this.showConfirmModal.set(false);
  }

  confirmTransfer(): void {
    const email = this.recipientEmail();
    const amount = this.transferAmount();
    if (!email || !amount) return;

    this.showConfirmModal.set(false);
    this.creditState.transferCredits(email, amount);
  }

  resetForm(): void {
    this.recipientEmail.set('');
    this.transferAmount.set(null);
    this.creditState.clearSuccessMessage();
    this.creditState.clearLastTransfer();
    this.creditState.clearError();
  }

  clearError(): void {
    this.creditState.clearError();
  }
}

