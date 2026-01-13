import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TeamApiService } from './team-api.service';
import {
  Team,
  TeamSummary,
  TeamMember,
  TeamInvitation,
  InitiateTeamRequest,
  SubscriptionType,
  BillingCycle,
  PaymentGateway,
  TEAM_SUBSCRIPTION_TIERS
} from '../models/team.model';

interface CreateTeamWizardState {
  step: number;
  name: string;
  description: string;
  subscriptionType: SubscriptionType;
  billingCycle: BillingCycle;
  paymentGateway: PaymentGateway;
  paymentToken: string;
  otpSent: boolean;
  otp: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamStateService {
  private readonly teamApi = inject(TeamApiService);
  private readonly router = inject(Router);

  // ==================== State Signals ====================

  // Teams list
  private readonly _teams = signal<TeamSummary[]>([]);
  private readonly _isLoadingTeams = signal(false);

  // Current team detail
  private readonly _currentTeam = signal<Team | null>(null);
  private readonly _isLoadingTeam = signal(false);

  // Team members
  private readonly _members = signal<TeamMember[]>([]);
  private readonly _isLoadingMembers = signal(false);

  // Team invitations
  private readonly _invitations = signal<TeamInvitation[]>([]);
  private readonly _isLoadingInvitations = signal(false);

  // Create team wizard
  private readonly _wizardState = signal<CreateTeamWizardState>({
    step: 1,
    name: '',
    description: '',
    subscriptionType: 'TEAM_PREMIUM',
    billingCycle: 'MONTHLY',
    paymentGateway: 'stripe',
    paymentToken: '',
    otpSent: false,
    otp: ''
  });

  // UI State
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  // ==================== Public Readonly Signals ====================

  readonly teams = this._teams.asReadonly();
  readonly isLoadingTeams = this._isLoadingTeams.asReadonly();
  readonly currentTeam = this._currentTeam.asReadonly();
  readonly isLoadingTeam = this._isLoadingTeam.asReadonly();
  readonly members = this._members.asReadonly();
  readonly isLoadingMembers = this._isLoadingMembers.asReadonly();
  readonly invitations = this._invitations.asReadonly();
  readonly isLoadingInvitations = this._isLoadingInvitations.asReadonly();
  readonly wizardState = this._wizardState.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();

  // ==================== Computed Properties ====================

  readonly hasTeams = computed(() => this._teams().length > 0);

  readonly ownedTeams = computed(() =>
    this._teams().filter(t => t.isOwner)
  );

  readonly memberTeams = computed(() =>
    this._teams().filter(t => !t.isOwner)
  );

  readonly subscriptionTiers = computed(() => TEAM_SUBSCRIPTION_TIERS);

  readonly selectedTier = computed(() => {
    const state = this._wizardState();
    return TEAM_SUBSCRIPTION_TIERS.find(t => t.type === state.subscriptionType);
  });

  readonly selectedPrice = computed(() => {
    const tier = this.selectedTier();
    const state = this._wizardState();
    if (!tier) return 0;
    return state.billingCycle === 'MONTHLY' ? tier.monthlyPrice : tier.yearlyPrice;
  });

  readonly currentTeamIsEnterprise = computed(() =>
    this._currentTeam()?.subscriptionType === 'TEAM_ENTERPRISE'
  );

  readonly currentTeamIsOwner = computed(() =>
    this._currentTeam()?.isOwner ?? false
  );

  readonly currentTeamMemberCount = computed(() =>
    this._members().length
  );

  readonly currentTeamAdmins = computed(() =>
    this._members().filter(m => m.role === 'ADMIN' || m.role === 'OWNER')
  );

  readonly canAddMembers = computed(() => {
    const team = this._currentTeam();
    if (!team) return false;
    return team.currentMemberCount < team.maxMembers;
  });

  readonly remainingSlots = computed(() => {
    const team = this._currentTeam();
    if (!team) return 0;
    return team.maxMembers - team.currentMemberCount;
  });

  readonly trialDaysRemaining = computed(() => {
    const team = this._currentTeam();
    if (!team?.trialEndsAt) return null;
    const days = Math.ceil((new Date(team.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  });

  readonly isTrialing = computed(() =>
    this._currentTeam()?.subscriptionStatus === 'TRIALING'
  );

  readonly isCancelled = computed(() =>
    this._currentTeam()?.subscriptionStatus === 'CANCELLED'
  );

  // ==================== Teams List Actions ====================

  loadMyTeams(): void {
    this._isLoadingTeams.set(true);
    this._error.set(null);

    this.teamApi.getMyTeams().subscribe({
      next: (teams) => {
        this._teams.set(teams);
        this._isLoadingTeams.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to load teams');
        this._isLoadingTeams.set(false);
      }
    });
  }

  // ==================== Team Detail Actions ====================

  loadTeam(teamId: string): void {
    this._isLoadingTeam.set(true);
    this._error.set(null);

    this.teamApi.getTeam(teamId).subscribe({
      next: (team) => {
        this._currentTeam.set(team);
        this._isLoadingTeam.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to load team details');
        this._isLoadingTeam.set(false);
      }
    });
  }

  loadTeamMembers(teamId: string): void {
    this._isLoadingMembers.set(true);

    this.teamApi.getTeamMembers(teamId).subscribe({
      next: (members) => {
        this._members.set(members);
        this._isLoadingMembers.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to load team members');
        this._isLoadingMembers.set(false);
      }
    });
  }

  loadTeamInvitations(teamId: string): void {
    this._isLoadingInvitations.set(true);

    this.teamApi.getTeamInvitations(teamId).subscribe({
      next: (invitations) => {
        this._invitations.set(invitations);
        this._isLoadingInvitations.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to load invitations');
        this._isLoadingInvitations.set(false);
      }
    });
  }

  // ==================== Create Team Wizard ====================

  setWizardStep(step: number): void {
    this._wizardState.update(state => ({ ...state, step }));
  }

  updateWizardState(updates: Partial<CreateTeamWizardState>): void {
    this._wizardState.update(state => ({ ...state, ...updates }));
  }

  resetWizard(): void {
    this._wizardState.set({
      step: 1,
      name: '',
      description: '',
      subscriptionType: 'TEAM_PREMIUM',
      billingCycle: 'MONTHLY',
      paymentGateway: 'stripe',
      paymentToken: '',
      otpSent: false,
      otp: ''
    });
  }

  initiateTeamCreation(): void {
    const state = this._wizardState();
    this._isProcessing.set(true);
    this._error.set(null);

    const request: InitiateTeamRequest = {
      name: state.name,
      description: state.description || undefined,
      subscriptionType: state.subscriptionType,
      billingCycle: state.billingCycle,
      paymentGateway: state.paymentGateway,
      paymentToken: state.paymentToken || undefined
    };

    this.teamApi.initiateTeamCreation(request).subscribe({
      next: () => {
        this._wizardState.update(s => ({ ...s, otpSent: true, step: 4 }));
        this._successMessage.set('OTP sent to your email. Please verify to complete team creation.');
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to initiate team creation');
        this._isProcessing.set(false);
      }
    });
  }

  verifyAndCreateTeam(): void {
    const state = this._wizardState();
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.verifyAndCreateTeam({ otp: state.otp }).subscribe({
      next: (team) => {
        this._currentTeam.set(team);
        this._successMessage.set('Team created successfully! You have a 10-day free trial.');
        this._isProcessing.set(false);
        this.resetWizard();
        this.router.navigate(['/teams', team.id]);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Invalid OTP. Please try again.');
        this._isProcessing.set(false);
      }
    });
  }

  // ==================== Member Management ====================

  addMember(teamId: string, email: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.addMember(teamId, { email }).subscribe({
      next: (member) => {
        this._members.update(members => [...members, member]);
        this._currentTeam.update(team => team ? {
          ...team,
          currentMemberCount: team.currentMemberCount + 1
        } : null);
        this._successMessage.set(`${member.firstName} ${member.lastName} added to the team`);
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to add member');
        this._isProcessing.set(false);
      }
    });
  }

  removeMember(teamId: string, memberId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.removeMember(teamId, memberId).subscribe({
      next: () => {
        this._members.update(members => members.filter(m => m.id !== memberId));
        this._currentTeam.update(team => team ? {
          ...team,
          currentMemberCount: team.currentMemberCount - 1
        } : null);
        this._successMessage.set('Member removed successfully');
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to remove member');
        this._isProcessing.set(false);
      }
    });
  }

  batchRemoveMembers(teamId: string, memberIds: string[]): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.batchRemoveMembers(teamId, { memberIds }).subscribe({
      next: () => {
        this._members.update(members => members.filter(m => !memberIds.includes(m.id)));
        this._currentTeam.update(team => team ? {
          ...team,
          currentMemberCount: team.currentMemberCount - memberIds.length
        } : null);
        this._successMessage.set(`${memberIds.length} members removed successfully`);
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to remove members');
        this._isProcessing.set(false);
      }
    });
  }

  promoteMember(teamId: string, memberId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.promoteMemberToAdmin(teamId, memberId).subscribe({
      next: (member) => {
        this._members.update(members =>
          members.map(m => m.id === memberId ? member : m)
        );
        this._successMessage.set(`${member.firstName} ${member.lastName} promoted to Admin`);
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to promote member');
        this._isProcessing.set(false);
      }
    });
  }

  demoteMember(teamId: string, memberId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.demoteAdminToMember(teamId, memberId).subscribe({
      next: (member) => {
        this._members.update(members =>
          members.map(m => m.id === memberId ? member : m)
        );
        this._successMessage.set(`${member.firstName} ${member.lastName} demoted to Member`);
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to demote member');
        this._isProcessing.set(false);
      }
    });
  }

  // ==================== Invitations ====================

  sendInvitation(teamId: string, email: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.sendInvitation(teamId, { email }).subscribe({
      next: () => {
        this._successMessage.set(`Invitation sent to ${email}`);
        this._isProcessing.set(false);
        this.loadTeamInvitations(teamId);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to send invitation');
        this._isProcessing.set(false);
      }
    });
  }

  cancelInvitation(teamId: string, invitationId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.cancelInvitation(teamId, invitationId).subscribe({
      next: () => {
        this._invitations.update(invs => invs.filter(i => i.id !== invitationId));
        this._successMessage.set('Invitation cancelled');
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to cancel invitation');
        this._isProcessing.set(false);
      }
    });
  }

  acceptInvitation(token: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.acceptInvitation(token).subscribe({
      next: (member) => {
        this._successMessage.set('Invitation accepted! You are now a team member.');
        this._isProcessing.set(false);
        this.loadMyTeams();
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to accept invitation');
        this._isProcessing.set(false);
      }
    });
  }

  // ==================== Subscription Management ====================

  cancelSubscription(teamId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.cancelSubscription(teamId).subscribe({
      next: (team) => {
        this._currentTeam.set(team);
        this._successMessage.set('Subscription cancelled. Service will continue until the end of the billing period.');
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to cancel subscription');
        this._isProcessing.set(false);
      }
    });
  }

  reactivateTeam(teamId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.reactivateTeam(teamId).subscribe({
      next: (team) => {
        this._currentTeam.set(team);
        this._successMessage.set('Team reactivated successfully!');
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to reactivate team');
        this._isProcessing.set(false);
      }
    });
  }

  closeTeam(teamId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.closeTeam(teamId).subscribe({
      next: () => {
        this._successMessage.set('Team closed successfully');
        this._isProcessing.set(false);
        this.router.navigate(['/teams']);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to close team');
        this._isProcessing.set(false);
      }
    });
  }

  updateTeam(teamId: string, updates: { name?: string; description?: string }): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.teamApi.updateTeam(teamId, updates).subscribe({
      next: (team) => {
        this._currentTeam.set(team);
        this._successMessage.set('Team updated successfully');
        this._isProcessing.set(false);
      },
      error: (err) => {
        this._error.set(err.error?.message || 'Failed to update team');
        this._isProcessing.set(false);
      }
    });
  }

  // ==================== Utility ====================

  clearError(): void {
    this._error.set(null);
  }

  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  clearCurrentTeam(): void {
    this._currentTeam.set(null);
    this._members.set([]);
    this._invitations.set([]);
  }
}

