import { Component, OnInit, OnDestroy, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ViewportScroller } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs/operators';

import { HeaderComponent } from '../../../shared/components/navbar/header/header.component';
import { HeroComponent } from '../../../shared/components/hero/hero.component';
import { FooterComponent } from '../../../shared/components/navbar/footer/footer.component';

import { StatsComponent } from '../../../shared/components/stats/stats.component';
import { CtaComponent } from '../../../shared/components/cta/cta.component';
import { FaqComponent } from '../../../shared/components/faq/faq.component';
import { BlogPreviewComponent } from '../../../shared/components/blog-preview/blog-preview.component';
import { NewsletterComponent } from '../../../shared/components/newsletter/newsletter.component';
import { HowItWorksComponent } from '../../../shared/components/how-it-works/how-it-works.component';
import { TestimonialsComponent } from '../../../shared/components/testimonials/testimonials.component';
import { PlanPricingComponent } from '../../../shared/components/plan-pricing/plan-pricing.component';
import { FeaturesComponent } from '../../../shared/components/features/features.component';

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
    HowItWorksComponent,
    TestimonialsComponent,
    PlanPricingComponent,
    FooterComponent,
    StatsComponent,
    CtaComponent,
    FaqComponent,
    BlogPreviewComponent,
    NewsletterComponent,
    FeaturesComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
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
    { id: 'features', title: 'Features', visible: true },
    { id: 'how-it-works', title: 'How It Works', visible: true },
    { id: 'stats', title: 'Statistics', visible: true },
    { id: 'testimonials', title: 'Testimonials', visible: true },
    { id: 'pricing', title: 'Pricing', visible: true },
    { id: 'faq', title: 'FAQ', visible: true },
    { id: 'blog', title: 'Latest Posts', visible: true },
    { id: 'cta', title: 'Get Started', visible: true }
  ]);

  // Analytics tracking
  private analytics = signal<LandingPageAnalytics>({
    pageViews: 0,
    timeOnPage: 0,
    scrollDepth: 0,
    ctaClicks: 0,
    signups: 0
  });

  // Computed properties
  public isScrolled = computed(() => this.scrollY() > 100);
  public loadingComplete = computed(() => !this.isLoading());
  public visibleSections = computed(() =>
    this.sections().filter(section => section.visible)
  );

  // Landing page configuration
  public landingConfig = {
    showStats: true,
    showBlogPreviews: true,
    showNewsletter: true,
    enableAnimations: true,
    enableLazyLoading: true,
    trackAnalytics: true,
    showProgressIndicator: true
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
    this.title.setTitle('UnravelDocs - Transform Your Documentation Experience');
    this.meta.updateTag({
      name: 'description',
      content: 'Streamline your documentation workflow with UnravelDocs. Create, collaborate, and publish beautiful documentation with ease.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'documentation, collaboration, markdown, publishing, technical writing'
    });
    this.meta.updateTag({
      property: 'og:title',
      content: 'UnravelDocs - Transform Your Documentation Experience'
    });
    this.meta.updateTag({
      property: 'og:description',
      content: 'Streamline your documentation workflow with powerful collaboration tools and beautiful publishing.'
    });
    this.meta.updateTag({
      property: 'og:image',
      content: '/assets/images/og-landing.jpg'
    });
    this.meta.updateTag({
      property: 'og:url',
      content: 'https://unraveldocs.com'
    });
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
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
      scroll$.subscribe(scrollY => {
        this.scrollY.set(scrollY);
        this.updateScrollAnalytics(scrollY);
      })
    );
  }

  private setupIntersectionObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const sectionId = entry.target.id;
          const isVisible = entry.isIntersecting;

          // Update section visibility
          this.sections.update(sections =>
            sections.map(section =>
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
        rootMargin: '-50px 0px'
      }
    );

    // Observe all sections after a short delay
    setTimeout(() => {
      this.sections().forEach(section => {
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
    this.analytics.update(data => ({
      ...data,
      pageViews: data.pageViews + 1
    }));

    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime;
      this.analytics.update(data => ({
        ...data,
        timeOnPage: timeOnPage / 1000 // Convert to seconds
      }));
    });
  }

  private updateScrollAnalytics(scrollY: number): void {
    if (!this.landingConfig.trackAnalytics) return;

    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.min(100, (scrollY / documentHeight) * 100);

    this.analytics.update(data => ({
      ...data,
      scrollDepth: Math.max(data.scrollDepth, scrollPercentage)
    }));
  }

  private preloadCriticalSections(): void {
    // Preload critical images and resources
    const criticalImages = [
      '/assets/images/hero-bg.jpg',
      '/assets/images/feature-1.jpg',
      '/assets/images/testimonial-1.jpg'
    ];

    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  private addStructuredData(): void {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'UnravelDocs',
      'description': 'Documentation collaboration and publishing platform',
      'url': 'https://unraveldocs.com',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '127'
      }
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
        block: 'start'
      });
    }
  }

  skipToContent(): void {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getCurrentSection(): string {
    return this.currentSection();
  }

  getScrollProgress(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;

    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(100, (this.scrollY() / documentHeight) * 100);
  }

  // Section visibility and configuration methods
  shouldShowSection(sectionId: string): boolean {
    switch (sectionId) {
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

  getVariant(sectionId: string): string {
    switch (sectionId) {
      case 'how-it-works':
        return 'default';
      case 'final-cta':
        return 'primary';
      default:
        return 'default';
    }
  }

  getSectionVisibility(sectionId: string): boolean {
    const section = this.sections().find(s => s.id === sectionId);
    return section?.visible || false;
  }

  // Event handlers
  onCtaClick(source: string): void {
    console.log(`CTA clicked: ${source}`);

    // Track analytics
    this.analytics.update(data => ({
      ...data,
      ctaClicks: data.ctaClicks + 1
    }));

    // Handle different CTA actions
    switch (source) {
      case 'hero-primary':
        this.scrollToSection('pricing');
        break;
      case 'pricing-basic':
      case 'pricing-pro':
      case 'pricing-enterprise':
        // Redirect to signup with plan
        console.log(`Signup for plan: ${source}`);
        break;
      case 'final-cta':
        this.scrollToSection('pricing');
        break;
      default:
        console.log(`Generic CTA: ${source}`);
    }
  }

  onSignupComplete(): void {
    console.log('Signup completed');

    // Track analytics
    this.analytics.update(data => ({
      ...data,
      signups: data.signups + 1
    }));

    // Show success message or redirect
    // This would typically integrate with your auth system
  }

  onImageLoad(event: any): void {
    console.log('Image loaded:', event);
    // Handle successful image loading
  }

  onImageError(event: any): void {
    console.error('Image failed to load:', event);
    // Handle image loading errors - could show placeholder
  }

  onNewsletterSignup(email: string): void {
    console.log('Newsletter signup:', email);

    // Track analytics
    this.analytics.update(data => ({
      ...data,
      signups: data.signups + 1
    }));

    // Handle newsletter signup
    // This would typically call a newsletter service
  }

  // UI interaction methods
  openHelp(): void {
    console.log('Opening help');
    // This would typically open a help modal or redirect to help page
  }

  acceptCookies(): void {
    console.log('Cookies accepted');
    // Handle cookie acceptance
    localStorage.setItem('cookies-accepted', 'true');
  }

  declineCookies(): void {
    console.log('Cookies declined');
    // Handle cookie decline
    localStorage.setItem('cookies-accepted', 'false');
  }

  // Getter for analytics (for template)
  landingAnalytics() {
    return this.analytics();
  }
}
