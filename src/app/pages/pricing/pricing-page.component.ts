import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlanPricingComponent } from '../../shared/components/plan-pricing/plan-pricing.component';
import { HeaderComponent } from '../../shared/components/navbar/header/header.component';
import { FooterComponent } from '../../shared/components/navbar/footer/footer.component';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PlanPricingComponent,
    HeaderComponent,
    FooterComponent
  ],
  template: `
    <div class="pricing-page">
      <app-header></app-header>
      <main class="main-content">
        <app-plan-pricing
          [showIndividual]="true"
          [showTeam]="true">
        </app-plan-pricing>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .pricing-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding-top: 80px; /* Account for fixed header */
    }
  `]
})
export class PricingPageComponent {}

