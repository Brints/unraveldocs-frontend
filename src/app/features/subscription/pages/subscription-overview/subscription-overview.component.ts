import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionStateService } from '../../services/subscription-state.service';

@Component({
  selector: 'app-subscription-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-overview.component.html',
  styleUrls: ['./subscription-overview.component.css']
})
export class SubscriptionOverviewComponent implements OnInit {
  protected readonly subState = inject(SubscriptionStateService);

  // Local state
  showCancelModal = signal(false);
  cancelImmediately = signal(false);

  // From state service
  readonly currentSubscription = this.subState.currentSubscription;
  readonly subscriptionDetails = this.subState.subscriptionDetails;
  readonly storageInfo = this.subState.storageInfo;
  readonly currentPlan = this.subState.currentPlan;
  readonly currentTier = this.subState.currentTier;
  readonly usage = this.subState.usage;
  readonly isLoading = this.subState.isLoading;
  readonly isProcessing = this.subState.isProcessing;
  readonly error = this.subState.error;
  readonly successMessage = this.subState.successMessage;
  readonly isSubscribed = this.subState.isSubscribed;
  readonly isTrialing = this.subState.isTrialing;
  readonly isCanceled = this.subState.isCanceled;
  readonly trialDaysRemaining = this.subState.trialDaysRemaining;
  readonly daysUntilRenewal = this.subState.daysUntilRenewal;
  readonly documentsUsagePercent = this.subState.documentsUsagePercent;
  readonly ocrUsagePercent = this.subState.ocrUsagePercent;
  readonly storageUsagePercent = this.subState.storageUsagePercent;

  ngOnInit(): void {
    this.subState.loadSubscriptionData();
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

  // Helpers
  formatDate(dateString?: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  getUsageBarClass(percent: number): string {
    if (percent >= 90) return 'usage-critical';
    if (percent >= 70) return 'usage-warning';
    return 'usage-normal';
  }

  getTierIcon(tier: string): string {
    switch (tier) {
      case 'free': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'starter': return 'M13 10V3L4 14h7v7l9-11h-7z';
      case 'pro': return 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z';
      case 'enterprise': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      default: return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }
}

