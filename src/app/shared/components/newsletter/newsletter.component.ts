import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="newsletter-section">
      <div class="container">
        <div class="newsletter-content">
          <div class="newsletter-header">
            <h2>Stay in the Loop</h2>
            <p>Get the latest updates, tips, and insights delivered straight to your inbox.</p>
          </div>

          <form class="newsletter-form" (ngSubmit)="onSubmit()" #form="ngForm">
            <div class="form-group">
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                placeholder="Enter your email address"
                class="email-input"
                required
                email
                #emailInput="ngModel">
              <button
                type="submit"
                class="subscribe-btn"
                [disabled]="form.invalid || isLoading">
                @if (isLoading) {
                  <span class="spinner"></span>
                } @else {
                  Subscribe
                }
              </button>
            </div>

            @if (emailInput.invalid && emailInput.touched) {
              <div class="error-message">
                Please enter a valid email address
              </div>
            }

            @if (successMessage) {
              <div class="success-message">
                {{ successMessage }}
              </div>
            }

            @if (errorMessage) {
              <div class="error-message">
                {{ errorMessage }}
              </div>
            }
          </form>

          <div class="newsletter-benefits">
            <div class="benefit">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
              <span>Weekly documentation tips</span>
            </div>
            <div class="benefit">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
              <span>Product updates and features</span>
            </div>
            <div class="benefit">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
              <span>Exclusive content and resources</span>
            </div>
          </div>

          <p class="privacy-note">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .newsletter-section {
      padding: 4rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .newsletter-content {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    .newsletter-header h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .newsletter-header p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    .newsletter-form {
      margin-bottom: 2rem;
    }
    .form-group {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .email-input {
      flex: 1;
      min-width: 250px;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
    }
    .subscribe-btn {
      padding: 1rem 2rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .subscribe-btn:hover:not(:disabled) {
      background: #218838;
    }
    .subscribe-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .newsletter-benefits {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .benefit {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      justify-content: center;
    }
    .benefit svg {
      color: #28a745;
    }
    .success-message {
      color: #28a745;
      background: white;
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .error-message {
      color: #dc3545;
      background: white;
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .privacy-note {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    @media (max-width: 768px) {
      .form-group {
        flex-direction: column;
      }
      .email-input {
        min-width: unset;
      }
      .newsletter-benefits {
        text-align: left;
      }
    }
  `]
})
export class NewsletterComponent {
  @Output() subscribed = new EventEmitter<string>();
  @Output() subscriptionCompleted = new EventEmitter<void>();

  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit(): void {
    if (!this.email || this.isLoading) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Emit the subscription event
    this.subscribed.emit(this.email);

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;

      // Simulate success/failure
      if (this.email.includes('error')) {
        this.errorMessage = 'Something went wrong. Please try again.';
      } else {
        this.successMessage = 'Thanks for subscribing! Check your inbox for confirmation.';
        this.email = '';
        this.subscriptionCompleted.emit();
      }
    }, 1500);
  }
}
