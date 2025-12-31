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
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'TRIALING': return 'status-trial';
      case 'CANCELLED': return 'status-cancelled';
      case 'EXPIRED': return 'status-expired';
      case 'PAST_DUE': return 'status-past-due';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Active';
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

  formatDate(dateString?: string): string {
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
}

