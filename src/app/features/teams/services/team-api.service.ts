import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Team,
  TeamSummary,
  TeamMember,
  InitiateTeamRequest,
  VerifyTeamOtpRequest,
  AddMemberRequest,
  BatchRemoveMembersRequest,
  SendInvitationRequest,
  TeamApiResponse,
  TeamApiData
} from '../models/team.model';

/**
 * Transform raw API team data to normalized Team interface
 */
function transformTeamData(data: TeamApiData): Team {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    teamCode: data.teamCode,
    subscriptionType: normalizeSubscriptionType(data.subscriptionType),
    billingCycle: normalizeBillingCycle(data.billingCycle),
    subscriptionStatus: normalizeSubscriptionStatus(data.subscriptionStatus),
    subscriptionPrice: data.subscriptionPrice,
    currency: data.currency,
    isActive: data.isActive ?? data.active ?? true,
    isVerified: data.isVerified ?? data.verified ?? true,
    isClosed: data.isClosed ?? data.closed ?? false,
    autoRenew: data.autoRenew,
    trialEndsAt: data.trialEndsAt,
    nextBillingDate: data.nextBillingDate,
    subscriptionEndsAt: data.subscriptionEndsAt,
    cancellationRequestedAt: data.cancellationRequestedAt,
    createdAt: data.createdAt,
    currentMemberCount: data.currentMemberCount,
    maxMembers: data.maxMembers,
    monthlyDocumentLimit: data.monthlyDocumentLimit,
    isOwner: data.isOwner ?? data.owner ?? false
  };
}

function normalizeSubscriptionType(type: string): string {
  // Handle both "Team Premium" and "TEAM_PREMIUM" formats
  if (type.includes('ENTERPRISE') || type.toLowerCase().includes('enterprise')) {
    return 'TEAM_ENTERPRISE';
  }
  return 'TEAM_PREMIUM';
}

function normalizeBillingCycle(cycle: string): string {
  if (cycle.toUpperCase().includes('YEAR')) {
    return 'YEARLY';
  }
  return 'MONTHLY';
}

function normalizeSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'trial': 'TRIALING',
    'trialing': 'TRIALING',
    'active': 'ACTIVE',
    'cancelled': 'CANCELLED',
    'canceled': 'CANCELLED',
    'expired': 'EXPIRED',
    'past_due': 'PAST_DUE',
    'past due': 'PAST_DUE'
  };
  return statusMap[status.toLowerCase()] || status.toUpperCase();
}

function transformTeamSummary(data: any): TeamSummary {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    teamCode: data.teamCode,
    subscriptionType: normalizeSubscriptionType(data.subscriptionType),
    subscriptionStatus: normalizeSubscriptionStatus(data.subscriptionStatus),
    billingCycle: data.billingCycle ? normalizeBillingCycle(data.billingCycle) : undefined,
    subscriptionPrice: data.subscriptionPrice,
    currency: data.currency,
    currentMemberCount: data.currentMemberCount,
    maxMembers: data.maxMembers,
    monthlyDocumentLimit: data.monthlyDocumentLimit,
    isOwner: data.isOwner ?? data.owner ?? false,
    isActive: data.isActive ?? data.active ?? true,
    autoRenew: data.autoRenew,
    trialEndsAt: data.trialEndsAt,
    nextBillingDate: data.nextBillingDate,
    subscriptionEndsAt: data.subscriptionEndsAt,
    cancellationRequestedAt: data.cancellationRequestedAt,
    createdAt: data.createdAt
  };
}

@Injectable({
  providedIn: 'root'
})
export class TeamApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/teams`;

  // ==================== Team CRUD ====================

  /**
   * Initiate team creation - sends OTP
   */
  initiateTeamCreation(request: InitiateTeamRequest): Observable<void> {
    return this.http.post<TeamApiResponse<null>>(`${this.apiUrl}/initiate`, request)
      .pipe(map(() => undefined));
  }

  /**
   * Verify OTP and complete team creation
   */
  verifyAndCreateTeam(request: VerifyTeamOtpRequest): Observable<Team> {
    return this.http.post<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/verify`, request)
      .pipe(map(res => transformTeamData(res.data)));
  }

  /**
   * Get team details by ID
   */
  getTeam(teamId: string): Observable<Team> {
    return this.http.get<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/${teamId}`)
      .pipe(map(res => transformTeamData(res.data)));
  }

  /**
   * Get all teams the user belongs to
   */
  getMyTeams(): Observable<TeamSummary[]> {
    return this.http.get<TeamApiResponse<any[]>>(`${this.apiUrl}/my`)
      .pipe(map(res => res.data.map(transformTeamSummary)));
  }

  /**
   * Update team details
   */
  updateTeam(teamId: string, updates: Partial<Pick<Team, 'name' | 'description'>>): Observable<Team> {
    return this.http.patch<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/${teamId}`, updates)
      .pipe(map(res => transformTeamData(res.data)));
  }

  // ==================== Member Management ====================

  /**
   * Get team members
   */
  getTeamMembers(teamId: string): Observable<TeamMember[]> {
    return this.http.get<TeamApiResponse<TeamMember[]>>(`${this.apiUrl}/${teamId}/members`)
      .pipe(map(res => res.data));
  }

  /**
   * Add a member to team (by existing user email)
   */
  addMember(teamId: string, request: AddMemberRequest): Observable<TeamMember> {
    return this.http.post<TeamApiResponse<TeamMember>>(`${this.apiUrl}/${teamId}/members`, request)
      .pipe(map(res => res.data));
  }

  /**
   * Remove a member from team
   */
  removeMember(teamId: string, memberId: string): Observable<void> {
    return this.http.delete<TeamApiResponse<null>>(`${this.apiUrl}/${teamId}/members/${memberId}`)
      .pipe(map(() => undefined));
  }

  /**
   * Batch remove members
   */
  batchRemoveMembers(teamId: string, request: BatchRemoveMembersRequest): Observable<void> {
    return this.http.delete<TeamApiResponse<null>>(`${this.apiUrl}/${teamId}/members/batch`, {
      body: request
    }).pipe(map(() => undefined));
  }

  /**
   * Promote member to admin (Enterprise only)
   */
  promoteMemberToAdmin(teamId: string, memberId: string): Observable<TeamMember> {
    return this.http.post<TeamApiResponse<TeamMember>>(
      `${this.apiUrl}/${teamId}/members/${memberId}/promote`,
      {}
    ).pipe(map(res => res.data));
  }

  /**
   * Demote admin to member (Enterprise only)
   */
  demoteAdminToMember(teamId: string, memberId: string): Observable<TeamMember> {
    return this.http.post<TeamApiResponse<TeamMember>>(
      `${this.apiUrl}/${teamId}/members/${memberId}/demote`,
      {}
    ).pipe(map(res => res.data));
  }

  // ==================== Invitations (Enterprise Only) ====================

  /**
   * Send invitation to join team
   */
  sendInvitation(teamId: string, request: SendInvitationRequest): Observable<string> {
    return this.http.post<TeamApiResponse<string>>(`${this.apiUrl}/${teamId}/invitations`, request)
      .pipe(map(res => res.data));
  }


  /**
   * Accept an invitation (by token)
   */
  acceptInvitation(token: string): Observable<TeamMember> {
    return this.http.post<TeamApiResponse<TeamMember>>(`${this.apiUrl}/invitations/${token}/accept`, {})
      .pipe(map(res => res.data));
  }

  // ==================== Subscription Management ====================

  /**
   * Cancel team subscription
   */
  cancelSubscription(teamId: string): Observable<Team> {
    return this.http.post<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/${teamId}/cancel`, {})
      .pipe(map(res => transformTeamData(res.data)));
  }

  /**
   * Reactivate team (after cancellation or closure)
   */
  reactivateTeam(teamId: string): Observable<Team> {
    return this.http.post<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/${teamId}/reactivate`, {})
      .pipe(map(res => transformTeamData(res.data)));
  }

  /**
   * Close team permanently
   */
  closeTeam(teamId: string): Observable<void> {
    return this.http.delete<TeamApiResponse<null>>(`${this.apiUrl}/${teamId}`)
      .pipe(map(() => undefined));
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  updateSubscription(teamId: string, subscriptionType: 'TEAM_PREMIUM' | 'TEAM_ENTERPRISE', billingCycle: 'MONTHLY' | 'YEARLY'): Observable<Team> {
    return this.http.patch<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/${teamId}/subscription`, {
      subscriptionType,
      billingCycle
    }).pipe(map(res => transformTeamData(res.data)));
  }

  /**
   * Toggle auto-renewal
   */
  toggleAutoRenew(teamId: string, autoRenew: boolean): Observable<Team> {
    return this.http.patch<TeamApiResponse<TeamApiData>>(`${this.apiUrl}/${teamId}/auto-renew`, {
      autoRenew
    }).pipe(map(res => transformTeamData(res.data)));
  }
}

