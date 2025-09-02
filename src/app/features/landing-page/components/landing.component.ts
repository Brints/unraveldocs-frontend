import { Component } from '@angular/core';
import { HeaderComponent } from '../../../shared/components/navbar/header/header.component';
import { HeroComponent } from '../../../shared/components/hero.component';
import { FeaturesComponent } from '../../products/components/features.component';
import { HowItWorksComponent } from '../../../shared/components/how-it-works.component';
import { TestimonialsComponent } from '../../../shared/components/testimonials.component';
import { PricingComponent } from '../../../shared/components/pricing.component';
import { FooterComponent } from '../../../shared/components/navbar/footer/footer.component';

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
  templateUrl: 'landing.component.html',
  styleUrls: ['landing.component.css']
})
export class LandingComponent {}
