import { Component, Output, EventEmitter } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: 'newsletter.component.html',
  styleUrl: 'newsletter.component.css'
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
