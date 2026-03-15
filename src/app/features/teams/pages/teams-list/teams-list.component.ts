import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamStateService } from '../../services/team-state.service';
import { TeamSummary } from '../../models/team.model';

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

  readonly searchQuery = signal('');
  readonly teamView = signal<'all' | 'owned' | 'member'>('all');

  readonly totalTeamsCount = computed(() => this.teams().length);
  readonly ownedTeamsCount = computed(() => this.ownedTeams().length);
  readonly joinedTeamsCount = computed(() => this.memberTeams().length);
  readonly totalSeatsUsed = computed(() =>
    this.teams().reduce((acc, team) => acc + (team.currentMemberCount || 0), 0)
  );
  readonly totalSeatsAvailable = computed(() =>
    this.teams().reduce((acc, team) => acc + (team.maxMembers || 0), 0)
  );
  readonly activeTrialCount = computed(() =>
    this.teams().filter(team => this.isTrialStatus(team.subscriptionStatus)).length
  );

  readonly filteredOwnedTeams = computed(() =>
    this.ownedTeams().filter(team => this.matchesFilters(team))
  );

  readonly filteredMemberTeams = computed(() =>
    this.memberTeams().filter(team => this.matchesFilters(team))
  );

  readonly filteredTeamsCount = computed(
    () => this.filteredOwnedTeams().length + this.filteredMemberTeams().length
  );

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

  setTeamView(view: 'all' | 'owned' | 'member'): void {
    this.teamView.set(view);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value.trim().toLowerCase());
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

  getSubscriptionLabel(type: string): string {
    return type === 'TEAM_ENTERPRISE' ? 'Enterprise' : 'Premium';
  }

  getSubscriptionClass(type: string): string {
    return type === 'TEAM_ENTERPRISE' ? 'tier-enterprise' : 'tier-premium';
  }

  getMemberUtilization(team: TeamSummary): number {
    if (!team.maxMembers) {
      return 0;
    }
    return Math.min((team.currentMemberCount / team.maxMembers) * 100, 100);
  }

  getDocumentLimitLabel(team: TeamSummary): string {
    if (team.monthlyDocumentLimit == null || team.monthlyDocumentLimit <= 0) {
      return 'Unlimited docs / month';
    }
    return `${team.monthlyDocumentLimit} docs / month`;
  }

  getBillingLabel(team: TeamSummary): string {
    const billingCycle = (team.billingCycle || '').toString().toUpperCase();
    const cycleLabel = billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
    if (!team.subscriptionPrice || !team.currency) {
      return `Billing: ${cycleLabel}`;
    }

    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: team.currency,
        maximumFractionDigits: 0
      });
      return `${formatter.format(team.subscriptionPrice)} / ${cycleLabel}`;
    } catch {
      return `${team.subscriptionPrice} ${team.currency} / ${cycleLabel}`;
    }
  }

  getRenewalLabel(team: TeamSummary): string {
    const status = (team.subscriptionStatus || '').toString().toUpperCase();

    if (this.isTrialStatus(status) && team.trialEndsAt) {
      return `Trial ends ${this.formatDate(team.trialEndsAt)}`;
    }

    if (status === 'CANCELLED' && team.subscriptionEndsAt) {
      return `Access until ${this.formatDate(team.subscriptionEndsAt)}`;
    }

    if (team.nextBillingDate) {
      return `Next billing ${this.formatDate(team.nextBillingDate)}`;
    }

    if (team.createdAt) {
      return `Created ${this.formatDate(team.createdAt)}`;
    }

    return 'Billing details available in team settings';
  }

  private matchesFilters(team: TeamSummary): boolean {
    const currentView = this.teamView();
    if (currentView === 'owned' && !team.isOwner) {
      return false;
    }
    if (currentView === 'member' && team.isOwner) {
      return false;
    }

    const query = this.searchQuery();
    if (!query) {
      return true;
    }

    const searchable = [
      team.name,
      team.teamCode,
      this.getSubscriptionLabel(team.subscriptionType),
      this.getStatusLabel(team.subscriptionStatus)
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(query);
  }

  private isTrialStatus(status: string): boolean {
    return status === 'TRIAL' || status === 'TRIALING';
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

