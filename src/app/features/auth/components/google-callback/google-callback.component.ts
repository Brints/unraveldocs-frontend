import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from '../../services/google-auth.service';
import { GoogleSignupResponse, GoogleAuthError } from '../../models/google-auth.model';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">

        <!-- Loading State -->
        <div *ngIf="isProcessing" class="loading-state">
          <div class="loading-spinner">
            <svg class="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
            </svg>
          </div>
          <h2>Completing your signup...</h2>
          <p>Please wait while we process your Google authentication.</p>
        </div>

        <!-- Success State -->
        <div *ngIf="isSuccess" class="success-state">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2"/>
              <path d="m9 12 2 2 4-4" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Welcome aboard!</h2>
          <p>Your account has been created successfully. Redirecting you now...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="hasError" class="error-state">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2"/>
              <path d="m15 9-6 6" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m9 9 6 6" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Something went wrong</h2>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="error-actions">
            <button (click)="retryAuth()" class="retry-btn">
              Try Again
            </button>
            <button (click)="goToSignup()" class="signup-btn">
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .callback-content {
      background: white;
      border-radius: 1rem;
      padding: 3rem 2rem;
      text-align: center;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .loading-state,
    .success-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-spinner {
      color: #3B82F6;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .success-icon,
    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    p {
      margin: 0;
      color: #6B7280;
      line-height: 1.5;
    }

    .error-message {
      color: #EF4444;
      font-weight: 500;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .retry-btn,
    .signup-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .retry-btn {
      background: #3B82F6;
      color: white;
    }

    .retry-btn:hover {
      background: #2563EB;
    }

    .signup-btn {
      background: #F3F4F6;
      color: #374151;
    }

    .signup-btn:hover {
      background: #E5E7EB;
    }

    @media (max-width: 640px) {
      .callback-content {
        padding: 2rem 1rem;
      }

      .error-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      h2 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly googleAuth = inject(GoogleAuthService);

  isProcessing = true;
  isSuccess = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);

      // Check for error parameters first
      const error = urlParams.get('error');
      if (error) {
        this.handleError(`Authentication failed: ${error}`);
        return;
      }

      // Handle the callback
      const signupResponse = await this.googleAuth.handleRedirectCallback(urlParams);

      this.handleSuccess(signupResponse);

    } catch (error) {
      this.handleError((error as GoogleAuthError).message);
    }
  }

  private handleSuccess(response: GoogleSignupResponse): void {
    this.isProcessing = false;
    this.isSuccess = true;

    // Redirect after a short delay to show success message
    setTimeout(() => {
      const redirectUrl = response.isNewUser ? '/onboarding' : '/dashboard';
      this.router.navigate([redirectUrl]);
    }, 2000);
  }

  private handleError(message: string): void {
    this.isProcessing = false;
    this.hasError = true;
    this.errorMessage = message;
  }

  retryAuth(): void {
    // Clear error state and try again
    this.hasError = false;
    this.isProcessing = true;
    this.errorMessage = '';

    // Restart the callback process
    setTimeout(() => {
      this.handleCallback();
    }, 100);
  }

  goToSignup(): void {
    this.router.navigate(['/auth/signup']);
  }
}
