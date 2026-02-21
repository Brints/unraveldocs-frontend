import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenRefreshService } from './core/auth/services/token-refresh.service';
import { AuthService } from './core/auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ReDraft - Unlock Your Text. Edit Anything.';

  private readonly tokenRefreshService = inject(TokenRefreshService);
  private readonly authService = inject(AuthService);
  private subscription: Subscription | null = null;

  ngOnInit(): void {
    // Start token refresh timer if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.tokenRefreshService.startTokenRefreshTimer();
    }

    // Subscribe to user changes to start/stop token refresh
    this.subscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.tokenRefreshService.startTokenRefreshTimer();
      } else {
        this.tokenRefreshService.stopTokenRefreshTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this.tokenRefreshService.stopTokenRefreshTimer();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
