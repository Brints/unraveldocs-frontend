import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamStateService } from '../../services/team-state.service';

interface SentInvitation {
  id: string;
  email: string;
  sentAt: Date;
}

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
          <div class="alert alert-error">
            {{ error() }}
            <button type="button" class="alert-close" (click)="teamState.clearError()">×</button>
          </div>
        }
        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
            <button type="button" class="alert-close" (click)="teamState.clearSuccessMessage()">×</button>
          </div>
        }

        <div class="invite-form-card">
          <h3>Send Invitation</h3>
          <p class="form-description">Enter the email address of someone you'd like to invite to your team. They will receive an email with a link to join.</p>
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
              @if (isProcessing()) {
                <span class="spinner-small"></span>
                Sending...
              } @else {
                Send Invite
              }
            </button>
          </form>
        </div>

        <div class="invitations-section">
          <h3>Recently Sent Invitations</h3>
          <p class="section-description">Invitations sent during this session. Recipients will receive an email with a link to join.</p>
          @if (sentInvitations().length === 0) {
            <div class="empty-state">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <p>No invitations sent yet</p>
              <span class="empty-hint">Use the form above to invite team members</span>
            </div>
          } @else {
            <div class="invitations-list">
              @for (inv of sentInvitations(); track inv.id) {
                <div class="invitation-card">
                  <div class="inv-icon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="inv-details">
                    <div class="inv-email">{{ inv.email }}</div>
                    <div class="inv-meta">Sent {{ formatDate(inv.sentAt) }}</div>
                  </div>
                  <span class="inv-status pending">Pending</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="info-card">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="info-content">
            <strong>How it works</strong>
            <p>Invitees will receive an email with a unique link. When they click the link and sign in (or create an account), they'll automatically join your team.</p>
          </div>
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

    .alert { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #dcfce7; color: #166534; }
    .alert-close { margin-left: auto; background: none; border: none; font-size: 1.25rem; cursor: pointer; opacity: 0.7; }
    .alert-close:hover { opacity: 1; }

    .invite-form-card { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem; }
    .invite-form-card h3 { font-size: 1rem; font-weight: 600; color: #111827; margin: 0 0 0.5rem; }
    .form-description { font-size: 0.875rem; color: #6b7280; margin: 0 0 1rem; }
    .invite-form { display: flex; gap: 0.75rem; }
    .invite-input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.9375rem; }
    .invite-input:focus { outline: none; border-color: #6366f1; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; font-weight: 600; color: white; background: #6366f1; border: none; border-radius: 0.5rem; cursor: pointer; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner-small { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .invitations-section { margin-bottom: 1.5rem; }
    .invitations-section h3 { font-size: 1rem; font-weight: 600; color: #111827; margin: 0 0 0.25rem; }
    .section-description { font-size: 0.8125rem; color: #6b7280; margin: 0 0 1rem; }

    .invitations-list { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
    .invitation-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-bottom: 1px solid #f3f4f6; }
    .invitation-card:last-child { border-bottom: none; }
    .inv-icon { display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; background: #e0e7ff; color: #6366f1; border-radius: 0.5rem; }
    .inv-details { flex: 1; }
    .inv-email { font-weight: 600; color: #111827; }
    .inv-meta { font-size: 0.75rem; color: #9ca3af; }
    .inv-status { padding: 0.25rem 0.625rem; font-size: 0.6875rem; font-weight: 600; border-radius: 9999px; text-transform: uppercase; }
    .inv-status.pending { background: #fef3c7; color: #92400e; }

    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2.5rem; color: #6b7280; background: white; border: 1px dashed #e5e7eb; border-radius: 0.75rem; }
    .empty-state svg { color: #d1d5db; margin-bottom: 0.75rem; }
    .empty-state p { font-weight: 500; color: #374151; margin: 0 0 0.25rem; }
    .empty-hint { font-size: 0.8125rem; }

    .info-card { display: flex; gap: 0.75rem; padding: 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 0.75rem; }
    .info-card svg { color: #0284c7; flex-shrink: 0; margin-top: 0.125rem; }
    .info-content strong { display: block; font-size: 0.875rem; color: #0c4a6e; margin-bottom: 0.25rem; }
    .info-content p { font-size: 0.8125rem; color: #0369a1; margin: 0; }

    .w-5 { width: 1.25rem; } .h-5 { height: 1.25rem; }
    .w-10 { width: 2.5rem; } .h-10 { height: 2.5rem; }
    .w-12 { width: 3rem; } .h-12 { height: 3rem; }
  `]
})
export class TeamInvitationsComponent implements OnInit {
  protected readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);

  readonly team = this.teamState.currentTeam;
  readonly isProcessing = this.teamState.isProcessing;
  readonly error = this.teamState.error;
  readonly successMessage = this.teamState.successMessage;
  readonly isEnterprise = this.teamState.currentTeamIsEnterprise;

  // Track sent invitations locally (during this session)
  sentInvitations = signal<SentInvitation[]>([]);

  inviteEmail = '';
  private teamId = '';

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    if (this.teamId && !this.team()) {
      this.teamState.loadTeam(this.teamId);
    }
  }

  sendInvitation(): void {
    if (!this.inviteEmail.trim()) return;

    const email = this.inviteEmail.trim();

    this.teamState.sendInvitation(this.teamId, email);

    // Add to local sent invitations list
    this.sentInvitations.update(invs => [
      {
        id: crypto.randomUUID(),
        email: email,
        sentAt: new Date()
      },
      ...invs
    ]);

    this.inviteEmail = '';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

