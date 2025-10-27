import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ViewportScroller } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs/operators';

import { HeaderComponent } from '../../../shared/components/navbar/header/header.component';
import { HeroComponent } from '../../../shared/components/hero/hero.component';
import { FeaturesComponent } from '../../products/components/features.component';
import { HowItWorksComponent } from '../../../shared/components/how-it-works/how-it-works.component';
import { TestimonialsComponent } from '../../../shared/components/testimonials/testimonials.component';
import { PricingComponent } from '../../../shared/components/pricing/pricing.component';
import { FooterComponent } from '../../../shared/components/navbar/footer/footer.component';

interface LandingPageSection {
  id: string;
  title: string;
  visible: boolean;
}

interface LandingPageAnalytics {
  pageViews: number;
  timeOnPage: number;
  scrollDepth: number;
  ctaClicks: number;
  signups: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    HeroComponent,
    FeaturesComponent,
    HowItWorksComponent,
    TestimonialsComponent,
    PricingComponent,
    FooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit, OnDestroy {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly platformId = inject(PLATFORM_ID);

  // Reactive state
  private scrollY = signal(0);
  private isLoading = signal(true);
  private currentSection = signal('hero');
  private subscriptions = new Subscription();

  // Landing page sections with visibility tracking
  sections = signal<LandingPageSection[]>([
    { id: 'hero', title: 'Home', visible: true },
    { id: 'features', title: 'Features', visible: false },
    { id: 'how-it-works', title: 'How It Works', visible: false },
    { id: 'stats', title: 'Statistics', visible: false },
    { id: 'testimonials', title: 'Testimonials', visible: false },
    { id: 'pricing', title: 'Pricing', visible: false },
    { id: 'faq', title: 'FAQ', visible: false },
    { id: 'blog', title: 'Latest Posts', visible: false },
    { id: 'cta', title: 'Get Started', visible: false },
  ]);

  // Analytics tracking
  private analytics = signal<LandingPageAnalytics>({
    pageViews: 0,
    timeOnPage: 0,
    scrollDepth: 0,
    ctaClicks: 0,
    signups: 0,
  });

  // Computed properties
  public isScrolled = computed(() => this.scrollY() > 100);
  public loadingComplete = computed(() => !this.isLoading());
  public visibleSections = computed(() =>
    this.sections().filter((section) => section.visible)
  );

  // Landing page configuration
  public landingConfig = {
    showStats: true,
    showBlogPreviews: true,
    showNewsletter: true,
    enableAnimations: true,
    enableLazyLoading: true,
    trackAnalytics: true,
    showProgressIndicator: true,
  };

  ngOnInit(): void {
    this.initializePage();
    this.setupScrollTracking();
    this.setupIntersectionObserver();
    this.setupAnalytics();
    this.preloadCriticalSections();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializePage(): void {
    // Set meta tags for SEO
    this.title.setTitle(
      'UnravelDocs - Transform Your Documentation Experience'
    );
    this.meta.updateTag({
      name: 'description',
      content:
        'Streamline your documentation workflow with UnravelDocs. Create, collaborate, and publish beautiful documentation with ease.',
    });
    this.meta.updateTag({
      name: 'keywords',
      content:
        'documentation, collaboration, markdown, publishing, technical writing',
    });
    this.meta.updateTag({
      property: 'og:title',
      content: 'UnravelDocs - Transform Your Documentation Experience',
    });
    this.meta.updateTag({
      property: 'og:description',
      content:
        'Streamline your documentation workflow with powerful collaboration tools and beautiful publishing.',
    });
    this.meta.updateTag({
      property: 'og:image',
      content: '/assets/images/og-landing.jpg',
    });
    this.meta.updateTag({
      property: 'og:url',
      content: 'https://unraveldocs.com',
    });
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });

    // Set structured data for rich snippets
    this.addStructuredData();

    // Initialize loading state
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  private setupScrollTracking(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const scroll$ = fromEvent(window, 'scroll').pipe(
      throttleTime(16), // ~60fps
      map(() => window.pageYOffset)
    );

    this.subscriptions.add(
      scroll$.subscribe((scrollY) => {
        this.scrollY.set(scrollY);
        this.updateScrollAnalytics(scrollY);
      })
    );
  }

  private setupIntersectionObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id;
          const isVisible = entry.isIntersecting;

          // Update section visibility
          this.sections.update((sections) =>
            sections.map((section) =>
              section.id === sectionId
                ? { ...section, visible: isVisible }
                : section
            )
          );

          // Update current section for navigation
          if (isVisible && entry.intersectionRatio > 0.5) {
            this.currentSection.set(sectionId);
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '-50px 0px',
      }
    );

    // Observe all sections after a short delay
    setTimeout(() => {
      this.sections().forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);
  }

  private setupAnalytics(): void {
    if (!this.landingConfig.trackAnalytics) return;

    // Track page view
    this.analytics.update((data) => ({
      ...data,
      pageViews: data.pageViews + 1,
    }));

    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime;
      this.analytics.update((data) => ({
        ...data,
        timeOnPage: timeOnPage / 1000, // Convert to seconds
      }));
    });
  }

  private updateScrollAnalytics(scrollY: number): void {
    if (!this.landingConfig.trackAnalytics) return;

    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.min(100, (scrollY / documentHeight) * 100);

    this.analytics.update((data) => ({
      ...data,
      scrollDepth: Math.max(data.scrollDepth, scrollPercentage),
    }));
  }

  private preloadCriticalSections(): void {
    // Preload critical images and resources
    const criticalImages = [
      '/assets/images/hero-bg.jpg',
      '/assets/images/feature-1.jpg',
      '/assets/images/testimonial-1.jpg',
    ];

    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  private addStructuredData(): void {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'UnravelDocs',
      description: 'Documentation collaboration and publishing platform',
      url: 'https://unraveldocs.com',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '127',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  // Navigation methods
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Track navigation
      if (this.landingConfig.trackAnalytics) {
        console.log(`Navigated to section: ${sectionId}`);
      }
    }
  }

  // CTA tracking methods
  onCtaClick(ctaType: string): void {
    this.analytics.update((data) => ({
      ...data,
      ctaClicks: data.ctaClicks + 1,
    }));

    // Track specific CTA type
    console.log(`CTA clicked: ${ctaType}`);
  }

  onSignupComplete(): void {
    this.analytics.update((data) => ({
      ...data,
      signups: data.signups + 1,
    }));

    console.log('Signup completed from landing page');
  }

  // Performance optimization methods
  onImageLoad(imageName: string): void {
    console.log(`Image loaded: ${imageName}`);
  }

  onImageError(imageName: string): void {
    console.error(`Failed to load image: ${imageName}`);
  }

  // Accessibility methods
  skipToContent(): void {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  }

  // Public getters for template
  getCurrentSection(): string {
    return this.currentSection();
  }

  getScrollProgress(): number {
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(100, (this.scrollY() / documentHeight) * 100);
  }

  getAnalytics(): LandingPageAnalytics {
    return this.analytics();
  }

  // Feature flags for conditional rendering
  shouldShowSection(sectionName: string): boolean {
    switch (sectionName) {
      case 'stats':
        return this.landingConfig.showStats;
      case 'blog':
        return this.landingConfig.showBlogPreviews;
      case 'newsletter':
        return this.landingConfig.showNewsletter;
      default:
        return true;
    }
  }

  // A/B testing support
  getVariant(testName: string): string {
    // Simple A/B testing implementation
    const hash = this.hashCode(testName + navigator.userAgent);
    return hash % 2 === 0 ? 'A' : 'B';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
