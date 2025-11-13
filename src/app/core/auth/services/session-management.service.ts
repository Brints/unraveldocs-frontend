import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { takeWhile, tap } from 'rxjs/operators';

export interface SessionInfo {
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  deviceInfo: string;
  ipAddress?: string;
  isRemembered: boolean;
}

export interface LoginAttempt {
  timestamp: Date;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionManagementService {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  private sessionInfo = signal<SessionInfo | null>(null);
  private loginAttempts = signal<LoginAttempt[]>([]);
  private isSessionActive = signal(false);
  private timeUntilExpiry = signal(0);

  // Activity tracking
  private lastActivitySubject = new BehaviorSubject<Date>(new Date());
  private sessionTimer?: Observable<number>;

  // Computed properties
  public session = computed(() => this.sessionInfo());
  public attemptsForCurrentEmail = computed(() => {
    const attempts = this.loginAttempts();
    const email = this.getCurrentEmail();
    return email ? attempts.filter(a => a.email === email && !a.success) : [];
  });
  public isLocked = computed(() => {
    const attempts = this.attemptsForCurrentEmail();
    if (attempts.length < this.MAX_LOGIN_ATTEMPTS) return false;

    const latestAttempt = attempts[attempts.length - 1];
    const lockoutExpiry = new Date(latestAttempt.timestamp.getTime() + this.LOCKOUT_DURATION);
    return new Date() < lockoutExpiry;
  });
  public lockoutTimeRemaining = computed(() => {
    if (!this.isLocked()) return 0;

    const attempts = this.attemptsForCurrentEmail();
    const latestAttempt = attempts[attempts.length - 1];
    const lockoutExpiry = new Date(latestAttempt.timestamp.getTime() + this.LOCKOUT_DURATION);
    return Math.max(0, Math.floor((lockoutExpiry.getTime() - new Date().getTime()) / 1000));
  });

  constructor() {
    this.loadStoredData();
    this.setupActivityTracking();
    this.setupSessionMonitoring();
  }

  /**
   * Start a new session
   */
  startSession(email: string, rememberMe: boolean = false): void {
    const now = new Date();
    const deviceInfo = this.getDeviceInfo();

    const sessionInfo: SessionInfo = {
      loginTime: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : this.SESSION_TIMEOUT)),
      deviceInfo,
      isRemembered: rememberMe
    };

    this.sessionInfo.set(sessionInfo);
    this.isSessionActive.set(true);
    this.storeSessionData();
    this.startSessionTimer();

    // Record successful login
    this.recordLoginAttempt(email, true);
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.sessionInfo.set(null);
    this.isSessionActive.set(false);
    this.timeUntilExpiry.set(0);
    this.clearStoredData();
  }

  /**
   * Record a login attempt
   */
  recordLoginAttempt(email: string, success: boolean): void {
    const attempt: LoginAttempt = {
      timestamp: new Date(),
      email: email.toLowerCase(),
      success,
      userAgent: navigator.userAgent
    };

    this.loginAttempts.update(attempts => {
      const newAttempts = [...attempts, attempt];
      // Keep only recent attempts (last 24 hours)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return newAttempts.filter(a => a.timestamp > cutoff);
    });

    this.storeLoginAttempts();
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    const now = new Date();
    this.lastActivitySubject.next(now);

    const currentSession = this.sessionInfo();
    if (currentSession) {
      this.sessionInfo.set({
        ...currentSession,
        lastActivity: now
      });
      this.storeSessionData();
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const session = this.sessionInfo();
    if (!session) return false;

    return new Date() < session.expiresAt;
  }

  /**
   * Extend session if user is active
   */
  extendSession(): void {
    const session = this.sessionInfo();
    if (!session || !this.isSessionValid()) return;

    const now = new Date();
    const extendedExpiry = new Date(now.getTime() + this.SESSION_TIMEOUT);

    this.sessionInfo.set({
      ...session,
      expiresAt: extendedExpiry,
      lastActivity: now
    });

    this.storeSessionData();
  }

  /**
   * Get remaining login attempts
   */
  getRemainingAttempts(email: string): number {
    const attempts = this.loginAttempts().filter(
      a => a.email === email.toLowerCase() && !a.success
    );
    return Math.max(0, this.MAX_LOGIN_ATTEMPTS - attempts.length);
  }

  /**
   * Clear login attempts for email (after successful login)
   */
  clearLoginAttempts(email: string): void {
    this.loginAttempts.update(attempts =>
      attempts.filter(a => a.email !== email.toLowerCase() || a.success)
    );
    this.storeLoginAttempts();
  }

  /**
   * Get session time remaining in seconds
   */
  getTimeRemaining(): number {
    return this.timeUntilExpiry();
  }

  // Private methods

  private setupActivityTracking(): void {
    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.isSessionActive()) {
          this.updateActivity();
        }
      }, { passive: true });
    });
  }

  private setupSessionMonitoring(): void {
    // Check session validity every minute
    setInterval(() => {
      if (this.isSessionActive() && !this.isSessionValid()) {
        this.endSession();
      }
    }, 60000);
  }

  private startSessionTimer(): void {
    const session = this.sessionInfo();
    if (!session) return;

    const duration = session.expiresAt.getTime() - new Date().getTime();
    this.sessionTimer = timer(0, 1000).pipe(
      takeWhile(() => this.isSessionActive()),
      tap(() => {
        const remaining = Math.max(0, Math.floor((session.expiresAt.getTime() - new Date().getTime()) / 1000));
        this.timeUntilExpiry.set(remaining);

        if (remaining === 0) {
          this.endSession();
        }
      })
    );

    this.sessionTimer.subscribe();
  }

  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    // Browser detection
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // OS detection
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return `${browser} on ${os}`;
  }

  private getCurrentEmail(): string | null {
    // This would typically come from the current user context
    // For now, return null - implement based on your auth state
    return null;
  }

  private loadStoredData(): void {
    try {
      const storedSession = localStorage.getItem('sessionInfo');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        session.loginTime = new Date(session.loginTime);
        session.lastActivity = new Date(session.lastActivity);
        session.expiresAt = new Date(session.expiresAt);

        if (this.isSessionValid()) {
          this.sessionInfo.set(session);
          this.isSessionActive.set(true);
          this.startSessionTimer();
        } else {
          this.clearStoredData();
        }
      }

      const storedAttempts = localStorage.getItem('loginAttempts');
      if (storedAttempts) {
        const attempts = JSON.parse(storedAttempts).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
        this.loginAttempts.set(attempts);
      }
    } catch (error) {
      console.error('Error loading stored session data:', error);
      this.clearStoredData();
    }
  }

  private storeSessionData(): void {
    const session = this.sessionInfo();
    if (session) {
      localStorage.setItem('sessionInfo', JSON.stringify(session));
    }
  }

  private storeLoginAttempts(): void {
    localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts()));
  }

  private clearStoredData(): void {
    localStorage.removeItem('sessionInfo');
  }
}
