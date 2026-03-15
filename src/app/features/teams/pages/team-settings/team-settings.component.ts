import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamStateService } from '../../services/team-state.service';
import { TEAM_SUBSCRIPTION_TIERS } from '../../models/team.model';

@Component({
  selector: 'app-team-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './team-settings.component.html',
  styleUrls: ['./team-settings.component.css']
})
export class TeamSettingsComponent implements OnInit {
  protected readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);

  readonly team = this.teamState.currentTeam;
  readonly isProcessing = this.teamState.isProcessing;
  readonly error = this.teamState.error;
  readonly successMessage = this.teamState.successMessage;
  readonly isOwner = this.teamState.currentTeamIsOwner;
  readonly isEnterprise = this.teamState.currentTeamIsEnterprise;
  readonly isCancelled = this.teamState.isCancelled;
  readonly subscriptionTiers = TEAM_SUBSCRIPTION_TIERS;

  // Form fields
  teamName = '';
  teamDescription = '';

  // Modal states
  showCancelModal = signal(false);
  showCloseModal = signal(false);

  private teamId = '';

  constructor() {
    // Keep form fields in sync when team data arrives asynchronously.
    effect(() => {
      const currentTeam = this.team();
      if (currentTeam) {
        this.teamName = currentTeam.name;
        this.teamDescription = currentTeam.description || '';
      }
    });
  }

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    if (this.teamId) {
      if (!this.team()) {
        this.teamState.loadTeam(this.teamId);
      }
    }

  }

  updateTeamDetails(): void {
    if (!this.teamName.trim()) return;
    this.teamState.updateTeam(this.teamId, {
      name: this.teamName.trim(),
      description: this.teamDescription.trim() || undefined
    });
  }

  cancelSubscription(): void {
    this.teamState.cancelSubscription(this.teamId);
    this.showCancelModal.set(false);
  }

  reactivateTeam(): void {
    this.teamState.reactivateTeam(this.teamId);
  }

  closeTeam(): void {
    this.teamState.closeTeam(this.teamId);
    this.showCloseModal.set(false);
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  getStatusClass(status: string): string {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'ACTIVE':
        return 'status-active';
      case 'TRIAL':
      case 'TRIALING':
        return 'status-trial';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'PAST_DUE':
        return 'status-past-due';
      case 'EXPIRED':
        return 'status-expired';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'ACTIVE':
        return 'Active';
      case 'TRIAL':
      case 'TRIALING':
        return 'Trial';
      case 'CANCELLED':
        return 'Cancelled';
      case 'PAST_DUE':
        return 'Past Due';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  }

  isTrialing(): boolean {
    const status = this.team()?.subscriptionStatus?.toUpperCase();
    return status === 'TRIAL' || status === 'TRIALING';
  }

  isPastDue(): boolean {
    return this.team()?.subscriptionStatus?.toUpperCase() === 'PAST_DUE';
  }

  getPrimaryBillingDateLabel(): string {
    if (this.isTrialing()) {
      return 'Trial Ends';
    }
    if (this.isCancelled()) {
      return 'Access Until';
    }
    if (this.isPastDue()) {
      return 'Payment Due';
    }
    return 'Next Billing Date';
  }

  getPrimaryBillingDateValue(): string {
    const currentTeam = this.team();
    if (!currentTeam) {
      return '—';
    }

    if (this.isTrialing()) {
      return this.formatDate(currentTeam.trialEndsAt);
    }
    if (this.isCancelled()) {
      return this.formatDate(currentTeam.subscriptionEndsAt);
    }
    return this.formatDate(currentTeam.nextBillingDate);
  }

  getCurrentTier() {
    return this.subscriptionTiers.find(t => t.type === this.team()?.subscriptionType);
  }

  getUpgradeTier() {
    return this.subscriptionTiers.find(t => t.type === 'TEAM_ENTERPRISE');
  }
}

