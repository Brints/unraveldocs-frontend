import { Component, inject, OnInit } from '@angular/core';
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
    return type === 'ENTERPRISE' ? 'Enterprise' : 'Premium';
  }

  getSubscriptionClass(type: string): string {
    return type === 'ENTERPRISE' ? 'tier-enterprise' : 'tier-premium';
  }
}

