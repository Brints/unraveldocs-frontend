import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { catchError, of, tap, finalize, from, switchMap, take, firstValueFrom } from 'rxjs';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { NotificationApiService } from './notification-api.service';
import { NotificationStateService } from './notification-state.service';
import {
  Device,
  RegisterDeviceRequest,
  Notification as AppNotification,
  DeviceType,
} from '../models/notification.model';
import { environment } from '../../../../environments/environment';

/**
 * Firebase Push Notification configuration
 */
export interface PushConfig {
  vapidKey: string;
}

/**
 * Push notification permission state
 */
export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Push notification received event
 */
export interface PushNotificationEvent {
  notification: AppNotification;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly api = inject(NotificationApiService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly ngZone = inject(NgZone);

  // Push notification state
  private readonly _isSupported = signal<boolean>(false);
  private readonly _permissionState = signal<PushPermissionState>('default');
  private readonly _isSubscribed = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentToken = signal<string | null>(null);
  private readonly _currentDeviceId = signal<string | null>(null);

  // Event subjects
  private readonly _notificationReceived = new Subject<PushNotificationEvent>();
  private readonly _notificationClicked = new Subject<PushNotificationEvent>();

  // Public readonly signals
  readonly isSupported = this._isSupported.asReadonly();
  readonly permissionState = this._permissionState.asReadonly();
  readonly isSubscribed = this._isSubscribed.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentToken = this._currentToken.asReadonly();

  // Public observables
  readonly notificationReceived$ = this._notificationReceived.asObservable();
  readonly notificationClicked$ = this._notificationClicked.asObservable();

  // Computed
  readonly canSubscribe = computed(() => {
    return this._isSupported() &&
           this._permissionState() !== 'denied' &&
           !this._isSubscribed();
  });

  readonly canRequestPermission = computed(() => {
    return this._isSupported() && this._permissionState() === 'default';
  });

  constructor() {
    this.checkSupport();
    this.checkPermissionState();
    this.setupServiceWorkerListener();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    const isSupported = 'serviceWorker' in navigator &&
                        'PushManager' in window &&
                        'Notification' in window;
    this._isSupported.set(isSupported);

    if (!isSupported) {
      this._permissionState.set('unsupported');
    }
  }

  /**
   * Check current notification permission state
   */
  private checkPermissionState(): void {
    if (!this._isSupported()) {
      return;
    }

    const permission = Notification.permission as PushPermissionState;
    this._permissionState.set(permission);
  }

  /**
   * Setup service worker message listener
   */
  private setupServiceWorkerListener(): void {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
      this.ngZone.run(() => {
        if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
          this._notificationReceived.next(event.data.payload);
          // Refresh unread count
          this.notificationState.refreshUnreadCount();
        } else if (event.data?.type === 'PUSH_NOTIFICATION_CLICKED') {
          this._notificationClicked.next(event.data.payload);
        }
      });
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<PushPermissionState> {
    if (!this._isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      this._permissionState.set(permission as PushPermissionState);
      return permission as PushPermissionState;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      this._error.set('Failed to request notification permission');
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(vapidKey: string): Promise<boolean> {
    if (!this._isSupported()) {
      this._error.set('Push notifications are not supported');
      return false;
    }

    // Check/request permission
    let permission = this._permissionState();
    if (permission === 'default') {
      permission = await this.requestPermission();
    }

    if (permission !== 'granted') {
      this._error.set('Notification permission denied');
      this._isLoading.set(false);
      return false;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Register the service worker
      let registration: ServiceWorkerRegistration;

      try {
        // Try to get existing registration first
        registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          || await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });

        // Wait for the service worker to be ready
        if (registration.installing) {
          await new Promise<void>((resolve, reject) => {
            const sw = registration.installing!;
            sw.addEventListener('statechange', () => {
              if (sw.state === 'activated') {
                resolve();
              } else if (sw.state === 'redundant') {
                reject(new Error('Service worker became redundant'));
              }
            });
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Service worker activation timeout')), 10000);
          });
        }
      } catch (swError: any) {
        console.error('Service worker registration failed:', swError);
        this._error.set('Failed to register service worker. Push notifications require HTTPS or localhost.');
        this._isLoading.set(false);
        return false;
      }

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription, create one
      if (!subscription) {
        if (!vapidKey || vapidKey === 'YOUR_VAPID_PUBLIC_KEY') {
          throw new Error('VAPID key not configured. Please set firebase.vapidKey in environment.ts');
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
        });
      }

      // Get the device token (endpoint + keys)
      const token = this.getTokenFromSubscription(subscription);
      this._currentToken.set(token);

      // Register device with backend
      const deviceRequest: RegisterDeviceRequest = {
        deviceToken: token,
        deviceType: 'WEB',
        deviceName: this.getDeviceName()
      };

      const device = await firstValueFrom(this.api.registerDevice(deviceRequest));

      if (device) {
        this._currentDeviceId.set(device.id);
        this._isSubscribed.set(true);
        // Refresh devices list in state service
        this.notificationState.loadDevices();
        this._isLoading.set(false);
        return true;
      }

      this._isLoading.set(false);
      return false;
    } catch (error: any) {
      console.error('Failed to subscribe to push notifications:', error);
      const message = error?.error?.message || error?.message || 'Failed to subscribe to push notifications';
      this._error.set(message);
      this._isLoading.set(false);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this._isSubscribed()) {
      return true;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Unregister from backend
      const deviceId = this._currentDeviceId();
      if (deviceId) {
        await firstValueFrom(this.api.unregisterDevice(deviceId));
      }

      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      this._isSubscribed.set(false);
      this._currentToken.set(null);
      this._currentDeviceId.set(null);

      // Refresh devices list
      this.notificationState.loadDevices();
      this._isLoading.set(false);

      return true;
    } catch (error: any) {
      console.error('Failed to unsubscribe from push notifications:', error);
      this._error.set(error?.error?.message || 'Failed to unsubscribe');
      this._isLoading.set(false);
      return false;
    }
  }

  /**
   * Check if user is currently subscribed to push notifications
   */
  async checkSubscriptionStatus(): Promise<boolean> {
    if (!this._isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      const isSubscribed = subscription !== null;
      this._isSubscribed.set(isSubscribed);

      if (isSubscribed && subscription) {
        this._currentToken.set(this.getTokenFromSubscription(subscription));
      }

      return isSubscribed;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Show a local notification (for testing or immediate notifications)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    if (!this._isSupported() || this._permissionState() !== 'granted') {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/assets/logo.svg',
        badge: '/assets/logo.svg',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  /**
   * Initialize push notifications
   * Call this on app startup after user is authenticated
   */
  async initialize(vapidKey: string): Promise<void> {
    if (!this._isSupported()) {
      console.log('Push notifications not supported');
      return;
    }

    // Check existing subscription status
    await this.checkSubscriptionStatus();

    // If permission granted but not subscribed, try to subscribe
    if (this._permissionState() === 'granted' && !this._isSubscribed()) {
      await this.subscribe(vapidKey);
    }
  }

  /**
   * Get device name from user agent
   */
  private getDeviceName(): string {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
    }

    // Detect OS
    if (ua.includes('Windows')) {
      os = 'Windows';
    } else if (ua.includes('Mac OS')) {
      os = 'macOS';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    } else if (ua.includes('Android')) {
      os = 'Android';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
    }

    return `${browser} on ${os}`;
  }

  /**
   * Convert subscription to token string
   */
  private getTokenFromSubscription(subscription: PushSubscription): string {
    // Create a JSON representation and encode as base64
    const subscriptionJson = JSON.stringify(subscription.toJSON());
    return btoa(subscriptionJson);
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this._notificationReceived.complete();
    this._notificationClicked.complete();
  }
}

