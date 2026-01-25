import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  templateUrl: 'team-invitations.component.html',
  styleUrl: 'team-invitations.component.css'
})
export class TeamInvitationsComponent implements OnInit {
  protected readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

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
    this.inviteEmail = '';

    this.teamState.sendInvitation(this.teamId, email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Only add to local sent invitations list after successful API response
          this.sentInvitations.update(invs => [
            {
              id: crypto.randomUUID(),
              email: email,
              sentAt: new Date()
            },
            ...invs
          ]);
        }
      });
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

