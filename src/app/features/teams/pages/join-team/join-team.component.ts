import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TeamStateService } from '../../services/team-state.service';

@Component({
  selector: 'app-join-team',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="join-team-page">
      <div class="join-card">
        @if (isProcessing()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <h2>Joining Team...</h2>
            <p>Please wait while we process your invitation</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2>Unable to Join</h2>
            <p>{{ error() }}</p>
            <a routerLink="/teams" class="btn-primary">Go to My Teams</a>
          </div>
        } @else if (success()) {
          <div class="success-state">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2>Welcome to the Team!</h2>
            <p>You've successfully joined the team. You can now access shared documents and collaborate with your teammates.</p>
            <a routerLink="/teams" class="btn-primary">View My Teams</a>
          </div>
        } @else {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Processing invitation...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .join-team-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .join-card {
      width: 100%;
      max-width: 24rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      padding: 3rem 2rem;
      text-align: center;
    }

    .loading-state, .error-state, .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem;
    }

    p {
      font-size: 0.9375rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
    }

    .error-state svg {
      color: #dc2626;
      margin-bottom: 1rem;
    }

    .success-state svg {
      color: #10b981;
      margin-bottom: 1rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 0.5rem;
      text-decoration: none;
    }

    .btn-primary:hover {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
  `]
})
export class JoinTeamComponent implements OnInit {
  private readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isProcessing = this.teamState.isProcessing;
  readonly error = this.teamState.error;
  readonly success = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.acceptInvitation(token);
    } else {
      this.router.navigate(['/teams']);
    }
  }

  private acceptInvitation(token: string): void {
    this.teamState.acceptInvitation(token);

    // Watch for success
    const checkSuccess = setInterval(() => {
      if (!this.isProcessing() && !this.error()) {
        this.success.set(true);
        clearInterval(checkSuccess);
      } else if (this.error()) {
        clearInterval(checkSuccess);
      }
    }, 100);
  }
}

