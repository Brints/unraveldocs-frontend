import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamStateService } from '../../services/team-state.service';

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.css']
})
export class TeamsListComponent implements OnInit {
  protected readonly teamState = inject(TeamStateService);

  readonly teams = this.teamState.teams;
  readonly ownedTeams = this.teamState.ownedTeams;
  readonly memberTeams = this.teamState.memberTeams;
  readonly hasTeams = this.teamState.hasTeams;
  readonly isLoading = this.teamState.isLoadingTeams;
  readonly error = this.teamState.error;

  // Billing cycle toggle
  billingCycle = signal<'monthly' | 'yearly'>('monthly');

  // Plan data
  readonly plans = [
    {
      name: 'Team Premium',
      monthlyPrice: 29,
      yearlyPrice: 290,
      yearlySavings: 58,
      features: [
        'Up to 10 team members',
        '200 documents/month',
        'Shared document library',
        '10-day free trial'
      ],
      isEnterprise: false
    },
    {
      name: 'Team Enterprise',
      monthlyPrice: 79,
      yearlyPrice: 790,
      yearlySavings: 158,
      features: [
        'Up to 15 team members',
        'Unlimited documents',
        'Admin role promotion',
        'Email invitations',
        'Priority support'
      ],
      isEnterprise: true
    }
  ];

  toggleBillingCycle(cycle: 'monthly' | 'yearly'): void {
    this.billingCycle.set(cycle);
  }

  getDisplayPrice(plan: typeof this.plans[0]): number {
    return this.billingCycle() === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  }

  getPricePeriod(): string {
    return this.billingCycle() === 'monthly' ? '/month' : '/year';
  }

  ngOnInit(): void {
    this.teamState.loadMyTeams();
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

  getSubscriptionLabel(type: string): string {
    return type === 'TEAM_ENTERPRISE' ? 'Enterprise' : 'Premium';
  }

  getSubscriptionClass(type: string): string {
    return type === 'TEAM_ENTERPRISE' ? 'tier-enterprise' : 'tier-premium';
  }
}

