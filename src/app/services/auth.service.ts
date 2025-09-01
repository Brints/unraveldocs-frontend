import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  marketing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal(false);

  // Public getters for reactive state
  currentUser = this.currentUserSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  get isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }

  constructor() {
    // Check for existing session on service initialization
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('unraveldocs_user');
    const storedToken = localStorage.getItem('unraveldocs_token');

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSignal.set(user);
      } catch (error) {
        // Clear invalid stored data
        this.clearStoredAuth();
      }
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('unraveldocs_user');
    localStorage.removeItem('unraveldocs_token');
  }

  async login(credentials: LoginRequest): Promise<User> {
    this.isLoadingSignal.set(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock validation - replace with real API call
      if (credentials.email === 'demo@unraveldocs.com' && credentials.password === 'password123') {
        const user: User = {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
          plan: 'pro',
          createdAt: new Date()
        };

        const token = 'mock_jwt_token_' + Date.now();

        // Store auth data
        localStorage.setItem('unraveldocs_user', JSON.stringify(user));
        localStorage.setItem('unraveldocs_token', token);

        // Update reactive state
        this.currentUserSignal.set(user);

        return user;
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error: any) {
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async signup(userData: SignupRequest): Promise<User> {
    this.isLoadingSignal.set(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock validation - replace with real API call
      if (userData.email === 'existing@example.com') {
        throw new Error('An account with this email already exists');
      }

      const user: User = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
        plan: 'free',
        createdAt: new Date()
      };

      const token = 'mock_jwt_token_' + Date.now();

      // Store auth data
      localStorage.setItem('unraveldocs_user', JSON.stringify(user));
      localStorage.setItem('unraveldocs_token', token);

      // Update reactive state
      this.currentUserSignal.set(user);

      return user;
    } catch (error: any) {
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    this.isLoadingSignal.set(true);

    try {
      // Simulate API call to invalidate token
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear stored data
      this.clearStoredAuth();

      // Update reactive state
      this.currentUserSignal.set(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async refreshToken(): Promise<string> {
    // Simulate token refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newToken = 'refreshed_jwt_token_' + Date.now();
    localStorage.setItem('unraveldocs_token', newToken);
    return newToken;
  }

  getToken(): string | null {
    return localStorage.getItem('unraveldocs_token');
  }

  // OAuth methods (placeholder implementations)
  async loginWithGoogle(): Promise<User> {
    throw new Error('Google OAuth not implemented yet');
  }

  async loginWithGitHub(): Promise<User> {
    throw new Error('GitHub OAuth not implemented yet');
  }

  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simulate sending reset email
    console.log(`Password reset email sent to ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simulate password reset
    console.log('Password reset successfully');
  }
}
