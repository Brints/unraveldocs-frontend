import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AnalyticsEvent {
  eventName: string;
  category: string;
  label?: string;
  value?: number;
  customProperties?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  pageUrl: string;
}

export interface PageAnalytics {
  pageViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  bounceRate: number;
  conversionRate: number;
  topExitPoints: string[];
  heatmapData: HeatmapPoint[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  elementId?: string;
  timestamp: Date;
}

export interface ConversionFunnel {
  step: string;
  visitors: number;
  conversionRate: number;
  dropoffRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class LandingPageAnalyticsService {
  private readonly STORAGE_KEY = 'landing_page_analytics';
  private readonly SESSION_KEY = 'analytics_session_id';

  private events = signal<AnalyticsEvent[]>([]);
  private sessionId = signal('');
  private userId = signal<string | null>(null);
  private pageLoadTime = signal(0);
  private scrollEvents = signal<Array<{depth: number, timestamp: Date}>>([]);
  private clickHeatmap = signal<HeatmapPoint[]>([]);

  // Computed analytics
  public totalEvents = computed(() => this.events().length);
  public uniqueSessions = computed(() =>
    new Set(this.events().map(e => e.sessionId)).size
  );
  public averageScrollDepth = computed(() => {
    const scrolls = this.scrollEvents();
    if (scrolls.length === 0) return 0;
    return scrolls.reduce((sum, s) => sum + s.depth, 0) / scrolls.length;
  });
  public conversionFunnel = computed(() => this.calculateConversionFunnel());

  private pageStartTime = Date.now();

  constructor() {
    this.initializeSession();
    this.loadStoredData();
    this.setupPerformanceTracking();
    this.setupErrorTracking();
  }

  /**
   * Track a custom event
   */
  trackEvent(
    eventName: string,
    category: string,
    label?: string,
    value?: number,
    customProperties?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      eventName,
      category,
      label,
      value,
      customProperties,
      timestamp: new Date(),
      sessionId: this.sessionId(),
      userId: this.userId(),
      pageUrl: window.location.href
    };

    this.events.update(events => [...events, event]);
    this.saveToStorage();

    // Send to external analytics if configured
    this.sendToExternalAnalytics(event);
  }

  /**
   * Track page view
   */
  trackPageView(): void {
    this.trackEvent('page_view', 'navigation', window.location.pathname);
    this.pageLoadTime.set(performance.now());
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth: number): void {
    this.scrollEvents.update(events => [
      ...events,
      { depth, timestamp: new Date() }
    ]);

    // Track milestone scroll depths
    if (depth >= 25 && !this.hasScrollMilestone(25)) {
      this.trackEvent('scroll_depth', 'engagement', '25%', 25);
    }
    if (depth >= 50 && !this.hasScrollMilestone(50)) {
      this.trackEvent('scroll_depth', 'engagement', '50%', 50);
    }
    if (depth >= 75 && !this.hasScrollMilestone(75)) {
      this.trackEvent('scroll_depth', 'engagement', '75%', 75);
    }
    if (depth >= 90 && !this.hasScrollMilestone(90)) {
      this.trackEvent('scroll_depth', 'engagement', '90%', 90);
    }
  }

  /**
   * Track click heatmap
   */
  trackClick(x: number, y: number, elementId?: string): void {
    const heatmapPoint: HeatmapPoint = {
      x,
      y,
      intensity: 1,
      elementId,
      timestamp: new Date()
    };

    this.clickHeatmap.update(points => [...points, heatmapPoint]);
    this.trackEvent('click', 'interaction', elementId, undefined, { x, y });
  }

  /**
   * Track CTA conversions
   */
  trackConversion(ctaType: string, value?: number): void {
    this.trackEvent('conversion', 'cta', ctaType, value);
  }

  /**
   * Track form interactions
   */
  trackFormStart(formName: string): void {
    this.trackEvent('form_start', 'form', formName);
  }

  trackFormComplete(formName: string): void {
    this.trackEvent('form_complete', 'form', formName);
  }

  trackFormError(formName: string, errorType: string): void {
    this.trackEvent('form_error', 'form', formName, undefined, { errorType });
  }

  /**
   * Track time spent on page
   */
  trackTimeOnPage(): number {
    const timeSpent = (Date.now() - this.pageStartTime) / 1000;
    this.trackEvent('time_on_page', 'engagement', 'seconds', timeSpent);
    return timeSpent;
  }

  /**
   * Track section visibility
   */
  trackSectionView(sectionId: string, visibilityDuration: number): void {
    this.trackEvent('section_view', 'engagement', sectionId, visibilityDuration);
  }

  /**
   * Get analytics dashboard data
   */
  getAnalyticsDashboard(): PageAnalytics {
    const events = this.events();
    const pageViews = events.filter(e => e.eventName === 'page_view').length;
    const uniqueVisitors = new Set(events.map(e => e.sessionId)).size;

    const timeEvents = events.filter(e => e.eventName === 'time_on_page');
    const averageTimeOnPage = timeEvents.length > 0
      ? timeEvents.reduce((sum, e) => sum + (e.value || 0), 0) / timeEvents.length
      : 0;

    const conversionEvents = events.filter(e => e.eventName === 'conversion');
    const conversionRate = pageViews > 0 ? (conversionEvents.length / pageViews) * 100 : 0;

    return {
      pageViews,
      uniqueVisitors,
      averageTimeOnPage,
      bounceRate: this.calculateBounceRate(),
      conversionRate,
      topExitPoints: this.getTopExitPoints(),
      heatmapData: this.clickHeatmap()
    };
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    const data = {
      events: this.events(),
      scrollEvents: this.scrollEvents(),
      heatmapData: this.clickHeatmap(),
      summary: this.getAnalyticsDashboard()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear analytics data
   */
  clearData(): void {
    this.events.set([]);
    this.scrollEvents.set([]);
    this.clickHeatmap.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId.set(userId);
    this.trackEvent('user_identified', 'user', userId);
  }

  // Private methods

  private initializeSession(): void {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    this.sessionId.set(sessionId);
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.events.set(data.events || []);
        this.scrollEvents.set(data.scrollEvents || []);
        this.clickHeatmap.set(data.heatmapData || []);
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        events: this.events(),
        scrollEvents: this.scrollEvents(),
        heatmapData: this.clickHeatmap()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  private hasScrollMilestone(depth: number): boolean {
    return this.events().some(e =>
      e.eventName === 'scroll_depth' && e.value === depth
    );
  }

  private calculateBounceRate(): number {
    const sessions = new Set(this.events().map(e => e.sessionId));
    let bounces = 0;

    sessions.forEach(sessionId => {
      const sessionEvents = this.events().filter(e => e.sessionId === sessionId);
      if (sessionEvents.length <= 1) {
        bounces++;
      }
    });

    return sessions.size > 0 ? (bounces / sessions.size) * 100 : 0;
  }

  private getTopExitPoints(): string[] {
    // Simplified exit point calculation
    const exitEvents = this.events().filter(e => e.eventName === 'page_exit');
    const exitCounts = exitEvents.reduce((acc, event) => {
      const page = event.label || 'unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(exitCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page]) => page);
  }

  private calculateConversionFunnel(): ConversionFunnel[] {
    const funnelSteps = [
      'page_view',
      'section_view',
      'form_start',
      'form_complete',
      'conversion'
    ];

    return funnelSteps.map((step, index) => {
      const stepEvents = this.events().filter(e => e.eventName === step);
      const visitors = new Set(stepEvents.map(e => e.sessionId)).size;

      const previousStepVisitors = index > 0
        ? new Set(this.events()
            .filter(e => e.eventName === funnelSteps[index - 1])
            .map(e => e.sessionId)).size
        : visitors;

      const conversionRate = previousStepVisitors > 0
        ? (visitors / previousStepVisitors) * 100
        : 100;

      const dropoffRate = 100 - conversionRate;

      return {
        step,
        visitors,
        conversionRate,
        dropoffRate
      };
    });
  }

  private setupPerformanceTracking(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackEvent('page_load_time', 'performance', 'load', navigation.loadEventEnd);
          this.trackEvent('dom_content_loaded', 'performance', 'dom', navigation.domContentLoadedEventEnd);
        }
      }, 0);
    });

    // Track Core Web Vitals
    if ('web-vital' in window) {
      // This would require web-vitals library
      // Implementation would go here
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', 'error', event.message, undefined, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('promise_rejection', 'error', event.reason?.toString());
    });
  }

  private sendToExternalAnalytics(event: AnalyticsEvent): void {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.eventName, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_map: event.customProperties
      });
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(event.eventName, {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.customProperties
      });
    }

    // Custom analytics endpoint
    // fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(console.error);
  }
}
