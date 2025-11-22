import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from '../../services/google-auth.service';
import { GoogleSignupResponse, GoogleAuthError } from '../../models/google-auth.model';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [],
  templateUrl: 'google-callback.component.html',
  styleUrl: 'google-callback.component.css'
})
export class GoogleCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly googleAuth = inject(GoogleAuthService);

  isProcessing = true;
  isSuccess = false;
  hasError = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.handleCallback();
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
    setTimeout(async () => {
      const redirectUrl = response.isNewUser ? '/onboarding' : '/dashboard';
      await this.router.navigate([redirectUrl]);
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
    setTimeout(async () => {
      await this.handleCallback();
    }, 100);
  }

  async goToSignup(): Promise<void> {
    await this.router.navigate(['/auth/signup']);
  }
}
