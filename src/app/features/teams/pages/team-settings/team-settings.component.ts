import { Component, inject, OnInit, signal } from '@angular/core';
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

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    if (this.teamId) {
      if (!this.team()) {
        this.teamState.loadTeam(this.teamId);
      }
    }

    // Initialize form values when team loads
    const team = this.team();
    if (team) {
      this.teamName = team.name;
      this.teamDescription = team.description || '';
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

  formatDate(dateString?: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getCurrentTier() {
    return this.subscriptionTiers.find(t => t.type === this.team()?.subscriptionType);
  }

  getUpgradeTier() {
    return this.subscriptionTiers.find(t => t.type === 'TEAM_ENTERPRISE');
  }
}

