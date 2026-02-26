import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CreditStateService } from '../../services/credit-state.service';
import {
  CreditTransactionType,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_COLORS,
  isIncomingTransaction,
} from '../../models/credit.model';

@Component({
  selector: 'app-credit-transactions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './credit-transactions.component.html',
  styleUrls: ['./credit-transactions.component.css']
})
export class CreditTransactionsComponent implements OnInit {
  private readonly creditState = inject(CreditStateService);

  readonly transactions = this.creditState.transactions;
  readonly balance = this.creditState.balance;
  readonly creditBalance = this.creditState.creditBalance;
  readonly isLoading = this.creditState.isLoading;
  readonly error = this.creditState.error;
  readonly pagination = this.creditState.pagination;
  readonly hasMorePages = this.creditState.hasMorePages;

  ngOnInit(): void {
    this.creditState.loadBalance();
    this.creditState.loadTransactions(0, 20);
  }

  loadMore(): void {
    this.creditState.loadMoreTransactions();
  }

  refresh(): void {
    this.creditState.loadTransactions(0, 20);
    this.creditState.loadBalance();
  }

  getTypeLabel(type: CreditTransactionType): string {
    return TRANSACTION_TYPE_LABELS[type] || type;
  }

  getTypeColors(type: CreditTransactionType): { bg: string; text: string; icon: string } {
    return TRANSACTION_TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-500' };
  }

  isIncoming(type: CreditTransactionType): boolean {
    return isIncomingTransaction(type);
  }

  getTransactionIcon(type: CreditTransactionType): string {
    const icons: Record<string, string> = {
      PURCHASE: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
      DEDUCTION: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      REFUND: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
      BONUS: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
      ADMIN_ADJUSTMENT: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      TRANSFER_SENT: 'M17 8l4 4m0 0l-4 4m4-4H3',
      TRANSFER_RECEIVED: 'M7 16l-4-4m0 0l4-4m-4 4h18',
      ADMIN_ALLOCATION: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    };
    return icons[type] || icons['PURCHASE'];
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}


