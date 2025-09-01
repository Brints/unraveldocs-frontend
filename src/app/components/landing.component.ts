import { Component } from '@angular/core';
import { HeaderComponent } from '../header.component';
import { HeroComponent } from './hero/hero.component';
import { FeaturesComponent } from './features/features.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { PricingComponent } from './pricing/pricing.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    FeaturesComponent,
    HowItWorksComponent,
    TestimonialsComponent,
    PricingComponent,
    FooterComponent
  ],
  template: `
    <app-header></app-header>

    <main class="pt-20">
      <app-hero></app-hero>

      <section id="features">
        <app-features></app-features>
      </section>

      <section id="how-it-works">
        <app-how-it-works></app-how-it-works>
      </section>

      <section id="testimonials">
        <app-testimonials></app-testimonials>
      </section>

      <section id="pricing">
        <app-pricing></app-pricing>
      </section>
    </main>

    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: block;
    }

    main {
      scroll-margin-top: 80px;
    }

    section {
      scroll-margin-top: 80px;
    }
  `]
})
export class LandingComponent {}

