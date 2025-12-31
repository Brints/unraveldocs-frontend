import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamStateService } from '../../services/team-state.service';

@Component({
  selector: 'app-team-invitations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="invitations-page">
      <div class="page-header">
        <a [routerLink]="['/teams', team()?.id]" class="back-link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Team
        </a>
        <h1 class="page-title">Email Invitations</h1>
        <p class="page-subtitle">Invite new users to join your team</p>
      </div>

      @if (!isEnterprise()) {
        <div class="upgrade-card">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <h3>Enterprise Feature</h3>
          <p>Email invitations are available on the Enterprise plan. Upgrade to invite new users who don't have an account yet.</p>
          <a [routerLink]="['/teams', team()?.id, 'settings']" class="btn-upgrade">Upgrade to Enterprise</a>
        </div>
      } @else {
        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }
        @if (successMessage()) {
          <div class="alert alert-success">{{ successMessage() }}</div>
        }

        <div class="invite-form-card">
          <h3>Send Invitation</h3>
          <form (ngSubmit)="sendInvitation()" class="invite-form">
            <input
              type="email"
              [(ngModel)]="inviteEmail"
              name="inviteEmail"
              placeholder="colleague@company.com"
              class="invite-input"
              required
            />
            <button type="submit" class="btn-primary" [disabled]="!inviteEmail.trim() || isProcessing()">
              Send Invite
            </button>
          </form>
        </div>

        <div class="invitations-section">
          <h3>Pending Invitations</h3>
          @if (isLoading()) {
            <div class="loading">Loading...</div>
          } @else if (invitations().length === 0) {
            <div class="empty-state">
              <p>No pending invitations</p>
            </div>
          } @else {
            <div class="invitations-list">
              @for (inv of invitations(); track inv.id) {
                <div class="invitation-card">
                  <div class="inv-email">{{ inv.email }}</div>
                  <div class="inv-meta">
                    Sent by {{ inv.invitedBy.firstName }} · Expires {{ formatDate(inv.expiresAt) }}
                  </div>
                  <button
                    type="button"
                    class="btn-cancel"
                    (click)="cancelInvitation(inv.id)"
                    [disabled]="isProcessing()"
                  >
                    Cancel
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .invitations-page { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
    .page-header { margin-bottom: 2rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: #6b7280; text-decoration: none; margin-bottom: 1rem; }
    .back-link:hover { color: #6366f1; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
    .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0; }

    .upgrade-card { text-align: center; padding: 3rem; background: white; border: 1px solid #e5e7eb; border-radius: 1rem; }
    .upgrade-card svg { color: #a855f7; margin-bottom: 1rem; }
    .upgrade-card h3 { font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0 0 0.75rem; }
    .upgrade-card p { color: #6b7280; margin: 0 0 1.5rem; }
    .btn-upgrade { display: inline-block; padding: 0.75rem 1.5rem; font-weight: 600; color: white; background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 0.5rem; text-decoration: none; }

    .alert { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #dcfce7; color: #166534; }

    .invite-form-card { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem; }
    .invite-form-card h3 { font-size: 1rem; font-weight: 600; color: #111827; margin: 0 0 1rem; }
    .invite-form { display: flex; gap: 0.75rem; }
    .invite-input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.9375rem; }
    .invite-input:focus { outline: none; border-color: #6366f1; }
    .btn-primary { padding: 0.75rem 1.5rem; font-weight: 600; color: white; background: #6366f1; border: none; border-radius: 0.5rem; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .invitations-section h3 { font-size: 1rem; font-weight: 600; color: #111827; margin: 0 0 1rem; }
    .invitations-list { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
    .invitation-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #f3f4f6; }
    .invitation-card:last-child { border-bottom: none; }
    .inv-email { flex: 1; font-weight: 600; color: #111827; }
    .inv-meta { font-size: 0.75rem; color: #9ca3af; }
    .btn-cancel { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 600; color: #dc2626; background: #fee2e2; border: none; border-radius: 0.375rem; cursor: pointer; }
    .btn-cancel:hover { background: #fecaca; }

    .empty-state { text-align: center; padding: 2rem; color: #6b7280; background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    .loading { text-align: center; padding: 2rem; color: #6b7280; }

    .w-5 { width: 1.25rem; } .h-5 { height: 1.25rem; }
    .w-12 { width: 3rem; } .h-12 { height: 3rem; }
  `]
})
export class TeamInvitationsComponent implements OnInit {
  protected readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);

  readonly team = this.teamState.currentTeam;
  readonly invitations = this.teamState.invitations;
  readonly isLoading = this.teamState.isLoadingInvitations;
  readonly isProcessing = this.teamState.isProcessing;
  readonly error = this.teamState.error;
  readonly successMessage = this.teamState.successMessage;
  readonly isEnterprise = this.teamState.currentTeamIsEnterprise;

  inviteEmail = '';
  private teamId = '';

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    if (this.teamId) {
      if (!this.team()) {
        this.teamState.loadTeam(this.teamId);
      }
      this.teamState.loadTeamInvitations(this.teamId);
    }
  }

  sendInvitation(): void {
    if (!this.inviteEmail.trim()) return;
    this.teamState.sendInvitation(this.teamId, this.inviteEmail.trim());
    this.inviteEmail = '';
  }

  cancelInvitation(invitationId: string): void {
    this.teamState.cancelInvitation(this.teamId, invitationId);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

