import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  timeToInteractive: number;
}

export interface OptimizationRecommendation {
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'seo' | 'accessibility' | 'ux';
  message: string;
  impact: 'high' | 'medium' | 'low';
  solution: string;
}

@Injectable({
  providedIn: 'root'
})
export class LandingPageOptimizationService {
  private readonly platformId = inject(PLATFORM_ID);

  private performanceMetrics = signal<PerformanceMetrics | null>(null);
  private optimizationScore = signal(0);
  private recommendations = signal<OptimizationRecommendation[]>([]);
  private resourceLoadTimes = signal<Record<string, number>>({});

  // Computed properties
  public score = computed(() => this.optimizationScore());
  public criticalIssues = computed(() =>
    this.recommendations().filter(r => r.type === 'critical')
  );
  public performanceGrade = computed(() => {
    const score = this.score();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializePerformanceTracking();
      this.setupResourceMonitoring();
      this.schedulePerformanceAudit();
    }
  }

  /**
   * Run comprehensive performance audit
   */
  async runPerformanceAudit(): Promise<void> {
    const metrics = await this.collectPerformanceMetrics();
    this.performanceMetrics.set(metrics);

    const recommendations = this.generateRecommendations(metrics);
    this.recommendations.set(recommendations);

    const score = this.calculateOptimizationScore(metrics, recommendations);
    this.optimizationScore.set(score);
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): OptimizationRecommendation[] {
    return this.recommendations();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics | null {
    return this.performanceMetrics();
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp)$/)) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Lazy load images with intersection observer
   */
  setupLazyLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const dataSrc = img.getAttribute('data-src');

          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * Optimize critical rendering path
   */
  optimizeCriticalRenderingPath(): void {
    // Remove render-blocking resources
    this.inlineCSS();
    this.deferNonCriticalCSS();
    this.optimizeWebFonts();
  }

  /**
   * Monitor and optimize Core Web Vitals
   */
  optimizeCoreWebVitals(): void {
    // Optimize LCP
    this.optimizeLargestContentfulPaint();

    // Optimize FID
    this.optimizeFirstInputDelay();

    // Optimize CLS
    this.optimizeCumulativeLayoutShift();
  }

  // Private methods

  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    return new Promise((resolve) => {
      if (!isPlatformBrowser(this.platformId)) {
        resolve({
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          firstInputDelay: 0,
          cumulativeLayoutShift: 0,
          totalBlockingTime: 0,
          timeToInteractive: 0
        });
        return;
      }

      // Use Performance Observer API
      let metrics: Partial<PerformanceMetrics> = {};

      // Collect paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Collect LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Collect FID
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          metrics.firstInputDelay = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Collect CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Calculate TTI and TBT (simplified)
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        metrics.timeToInteractive = navigation.domInteractive;
        metrics.totalBlockingTime = this.calculateTotalBlockingTime();

        resolve(metrics as PerformanceMetrics);
      }, 3000);
    });
  }

  private generateRecommendations(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // LCP recommendations
    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push({
        type: 'critical',
        category: 'performance',
        message: 'Largest Contentful Paint is too slow',
        impact: 'high',
        solution: 'Optimize images, use CDN, preload critical resources'
      });
    }

    // FID recommendations
    if (metrics.firstInputDelay > 100) {
      recommendations.push({
        type: 'warning',
        category: 'performance',
        message: 'First Input Delay is too high',
        impact: 'medium',
        solution: 'Reduce JavaScript execution time, break up long tasks'
      });
    }

    // CLS recommendations
    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push({
        type: 'critical',
        category: 'ux',
        message: 'Cumulative Layout Shift is too high',
        impact: 'high',
        solution: 'Set dimensions for images and videos, avoid dynamic content insertion'
      });
    }

    // Add SEO recommendations
    this.addSEORecommendations(recommendations);

    // Add accessibility recommendations
    this.addAccessibilityRecommendations(recommendations);

    return recommendations;
  }

  private calculateOptimizationScore(metrics: PerformanceMetrics, recommendations: OptimizationRecommendation[]): number {
    let score = 100;

    // Deduct points for poor Core Web Vitals
    if (metrics.largestContentfulPaint > 2500) score -= 20;
    if (metrics.firstInputDelay > 100) score -= 15;
    if (metrics.cumulativeLayoutShift > 0.1) score -= 20;
    if (metrics.firstContentfulPaint > 1800) score -= 10;

    // Deduct points for critical recommendations
    const criticalCount = recommendations.filter(r => r.type === 'critical').length;
    score -= criticalCount * 10;

    // Deduct points for warning recommendations
    const warningCount = recommendations.filter(r => r.type === 'warning').length;
    score -= warningCount * 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateTotalBlockingTime(): number {
    // Simplified TBT calculation
    const longTasks = performance.getEntriesByType('longtask');
    let tbt = 0;

    longTasks.forEach((task: any) => {
      if (task.duration > 50) {
        tbt += task.duration - 50;
      }
    });

    return tbt;
  }

  private addSEORecommendations(recommendations: OptimizationRecommendation[]): void {
    // Check for missing meta tags
    if (!document.querySelector('meta[name="description"]')) {
      recommendations.push({
        type: 'critical',
        category: 'seo',
        message: 'Missing meta description',
        impact: 'high',
        solution: 'Add a descriptive meta description tag'
      });
    }

    // Check for missing Open Graph tags
    if (!document.querySelector('meta[property="og:title"]')) {
      recommendations.push({
        type: 'warning',
        category: 'seo',
        message: 'Missing Open Graph tags',
        impact: 'medium',
        solution: 'Add Open Graph meta tags for social sharing'
      });
    }
  }

  private addAccessibilityRecommendations(recommendations: OptimizationRecommendation[]): void {
    // Check for images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      recommendations.push({
        type: 'critical',
        category: 'accessibility',
        message: `${imagesWithoutAlt.length} images missing alt text`,
        impact: 'high',
        solution: 'Add descriptive alt text to all images'
      });
    }

    // Check for buttons without accessible names
    const buttonsWithoutLabel = document.querySelectorAll('button:not([aria-label]):not([title])');
    if (buttonsWithoutLabel.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'accessibility',
        message: 'Buttons missing accessible labels',
        impact: 'medium',
        solution: 'Add aria-label or title attributes to buttons'
      });
    }
  }

  private initializePerformanceTracking(): void {
    // Track resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.resourceLoadTimes.update(times => ({
          ...times,
          [entry.name]: entry.duration
        }));
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  private setupResourceMonitoring(): void {
    // Monitor failed resource loads
    window.addEventListener('error', (event) => {
      if (event.target && 'src' in event.target) {
        console.warn(`Failed to load resource: ${(event.target as any).src}`);
      }
    }, true);
  }

  private schedulePerformanceAudit(): void {
    // Run audit after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.runPerformanceAudit();
      }, 1000);
    });
  }

  private inlineCSS(): void {
    // Inline critical CSS (implementation would depend on build process)
    console.log('Critical CSS should be inlined during build');
  }

  private deferNonCriticalCSS(): void {
    // Defer non-critical CSS loading
    const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
    styleSheets.forEach((sheet: any) => {
      if (!sheet.hasAttribute('data-critical')) {
        sheet.media = 'print';
        sheet.onload = () => { sheet.media = 'all'; };
      }
    });
  }

  private optimizeWebFonts(): void {
    // Add font-display: swap to web fonts
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'CustomFont';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeLargestContentfulPaint(): void {
    // Preload LCP element
    const heroImage = document.querySelector('.hero-section img');
    if (heroImage) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = (heroImage as HTMLImageElement).src;
      document.head.appendChild(link);
    }
  }

  private optimizeFirstInputDelay(): void {
    // Break up long tasks using scheduler.postTask or setTimeout
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      // Use scheduler.postTask when available
    } else {
      // Fallback to setTimeout for task scheduling
      const yieldToMain = () => {
        return new Promise(resolve => {
          setTimeout(resolve, 0);
        });
      };
    }
  }

  private optimizeCumulativeLayoutShift(): void {
    // Set dimensions for dynamic content
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach((img: any) => {
      img.style.aspectRatio = '16/9'; // Default aspect ratio
    });
  }
}
