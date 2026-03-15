import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TeamStateService } from '../../services/team-state.service';

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './team-dashboard.component.html',
  styleUrls: ['./team-dashboard.component.css']
})
export class TeamDashboardComponent implements OnInit, OnDestroy {
  protected readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);

  readonly team = this.teamState.currentTeam;
  readonly members = this.teamState.members;
  readonly isLoading = this.teamState.isLoadingTeam;
  readonly isLoadingMembers = this.teamState.isLoadingMembers;
  readonly error = this.teamState.error;
  readonly successMessage = this.teamState.successMessage;
  readonly isOwner = this.teamState.currentTeamIsOwner;
  readonly isEnterprise = this.teamState.currentTeamIsEnterprise;
  readonly trialDaysRemaining = this.teamState.trialDaysRemaining;
  readonly isTrialing = this.teamState.isTrialing;
  readonly isCancelled = this.teamState.isCancelled;
  readonly canAddMembers = this.teamState.canAddMembers;
  readonly remainingSlots = this.teamState.remainingSlots;

  private teamId = '';

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    if (this.teamId) {
      this.teamState.loadTeam(this.teamId);
      this.teamState.loadTeamMembers(this.teamId);
    }
  }

  ngOnDestroy(): void {
    this.teamState.clearCurrentTeam();
  }

  getStatusClass(status: string): string {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE': return 'status-active';
      case 'TRIAL':
      case 'TRIALING': return 'status-trial';
      case 'CANCELLED': return 'status-cancelled';
      case 'EXPIRED': return 'status-expired';
      case 'PAST_DUE': return 'status-past-due';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE': return 'Active';
      case 'TRIAL':
      case 'TRIALING': return 'Trial';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      case 'PAST_DUE': return 'Past Due';
      default: return status;
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'OWNER': return 'role-owner';
      case 'ADMIN': return 'role-admin';
      default: return 'role-member';
    }
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  isPastDue(): boolean {
    return this.team()?.subscriptionStatus?.toUpperCase() === 'PAST_DUE';
  }

  isTrialUrgent(): boolean {
    const remaining = this.trialDaysRemaining();
    return remaining !== null && remaining <= 3;
  }

  getRenewalLabel(): string {
    if (this.isCancelled()) {
      return 'Access Until';
    }
    if (this.isPastDue()) {
      return 'Payment Due';
    }
    if (this.isTrialing()) {
      return 'Trial Ends';
    }
    return 'Next Billing';
  }

  getRenewalValue(): string {
    const currentTeam = this.team();
    if (!currentTeam) {
      return '—';
    }

    if (this.isCancelled()) {
      return this.formatDate(currentTeam.subscriptionEndsAt);
    }

    if (this.isPastDue()) {
      return this.formatDate(currentTeam.nextBillingDate);
    }

    if (this.isTrialing()) {
      return this.formatDate(currentTeam.trialEndsAt);
    }

    return this.formatDate(currentTeam.nextBillingDate);
  }

  getOwnerActionTitle(): string {
    if (this.isPastDue()) {
      return 'Fix Billing';
    }
    if (this.isCancelled()) {
      return 'Reactivate Team';
    }
    if (this.isTrialing()) {
      return 'Upgrade Plan';
    }
    return 'Team Settings';
  }

  getOwnerActionDescription(): string {
    if (this.isPastDue()) {
      return 'Update payment details to restore full access';
    }
    if (this.isCancelled()) {
      return 'Reactivate subscription before access ends';
    }
    if (this.isTrialing()) {
      return 'Choose a paid plan before your trial expires';
    }
    return 'Manage subscription, billing, and team details';
  }

  getOwnerActionBadge(): string | null {
    if (this.isPastDue()) {
      return 'Action Required';
    }
    if (this.isCancelled()) {
      return 'Cancelled';
    }
    if (this.isTrialing()) {
      return 'Trial';
    }
    return null;
  }
}

