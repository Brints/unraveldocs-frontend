import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Team,
  TeamSummary,
  TeamMember,
  TeamInvitation,
  InitiateTeamRequest,
  VerifyTeamOtpRequest,
  AddMemberRequest,
  BatchRemoveMembersRequest,
  SendInvitationRequest,
  TeamApiResponse
} from '../models/team.model';

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
    return this.http.post<TeamApiResponse<Team>>(`${this.apiUrl}/verify`, request)
      .pipe(map(res => res.data));
  }

  /**
   * Get team details by ID
   */
  getTeam(teamId: string): Observable<Team> {
    return this.http.get<TeamApiResponse<Team>>(`${this.apiUrl}/${teamId}`)
      .pipe(map(res => res.data));
  }

  /**
   * Get all teams the user belongs to
   */
  getMyTeams(): Observable<TeamSummary[]> {
    return this.http.get<TeamApiResponse<TeamSummary[]>>(`${this.apiUrl}/my`)
      .pipe(map(res => res.data));
  }

  /**
   * Update team details
   */
  updateTeam(teamId: string, updates: Partial<Pick<Team, 'name' | 'description'>>): Observable<Team> {
    return this.http.patch<TeamApiResponse<Team>>(`${this.apiUrl}/${teamId}`, updates)
      .pipe(map(res => res.data));
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
   * Get pending invitations for team
   */
  getTeamInvitations(teamId: string): Observable<TeamInvitation[]> {
    return this.http.get<TeamApiResponse<TeamInvitation[]>>(`${this.apiUrl}/${teamId}/invitations`)
      .pipe(map(res => res.data));
  }

  /**
   * Cancel an invitation
   */
  cancelInvitation(teamId: string, invitationId: string): Observable<void> {
    return this.http.delete<TeamApiResponse<null>>(`${this.apiUrl}/${teamId}/invitations/${invitationId}`)
      .pipe(map(() => undefined));
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
    return this.http.post<TeamApiResponse<Team>>(`${this.apiUrl}/${teamId}/cancel`, {})
      .pipe(map(res => res.data));
  }

  /**
   * Reactivate team (after cancellation or closure)
   */
  reactivateTeam(teamId: string): Observable<Team> {
    return this.http.post<TeamApiResponse<Team>>(`${this.apiUrl}/${teamId}/reactivate`, {})
      .pipe(map(res => res.data));
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
    return this.http.patch<TeamApiResponse<Team>>(`${this.apiUrl}/${teamId}/subscription`, {
      subscriptionType,
      billingCycle
    }).pipe(map(res => res.data));
  }

  /**
   * Toggle auto-renewal
   */
  toggleAutoRenew(teamId: string, autoRenew: boolean): Observable<Team> {
    return this.http.patch<TeamApiResponse<Team>>(`${this.apiUrl}/${teamId}/auto-renew`, {
      autoRenew
    }).pipe(map(res => res.data));
  }
}

