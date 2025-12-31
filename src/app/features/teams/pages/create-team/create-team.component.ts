import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamStateService } from '../../services/team-state.service';
import { SubscriptionType, BillingCycle, PaymentGateway, TEAM_SUBSCRIPTION_TIERS } from '../../models/team.model';

@Component({
  selector: 'app-create-team',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-team.component.html',
  styleUrls: ['./create-team.component.css']
})
export class CreateTeamComponent implements OnInit, OnDestroy {
  protected readonly teamState = inject(TeamStateService);

  readonly wizardState = this.teamState.wizardState;
  readonly selectedTier = this.teamState.selectedTier;
  readonly selectedPrice = this.teamState.selectedPrice;
  readonly subscriptionTiers = this.teamState.subscriptionTiers;
  readonly isProcessing = this.teamState.isProcessing;
  readonly error = this.teamState.error;
  readonly successMessage = this.teamState.successMessage;

  // Form fields
  teamName = '';
  teamDescription = '';
  otp = '';

  ngOnInit(): void {
    this.teamState.resetWizard();
  }

  ngOnDestroy(): void {
    this.teamState.clearError();
    this.teamState.clearSuccessMessage();
  }

  // Step 1: Team Details
  setTeamDetails(): void {
    if (!this.teamName.trim()) return;

    this.teamState.updateWizardState({
      name: this.teamName.trim(),
      description: this.teamDescription.trim(),
      step: 2
    });
  }

  // Step 2: Subscription Selection
  selectSubscription(type: SubscriptionType): void {
    this.teamState.updateWizardState({ subscriptionType: type });
  }

  setBillingCycle(cycle: BillingCycle): void {
    this.teamState.updateWizardState({ billingCycle: cycle });
  }

  confirmSubscription(): void {
    this.teamState.updateWizardState({ step: 3 });
  }

  // Step 3: Payment
  selectPaymentGateway(gateway: PaymentGateway): void {
    this.teamState.updateWizardState({ paymentGateway: gateway });
  }

  proceedToVerification(): void {
    this.teamState.initiateTeamCreation();
  }

  // Step 4: OTP Verification
  verifyOtp(): void {
    if (!this.otp.trim() || this.otp.length !== 6) return;

    this.teamState.updateWizardState({ otp: this.otp.trim() });
    this.teamState.verifyAndCreateTeam();
  }

  // Navigation
  goToStep(step: number): void {
    if (step < this.wizardState().step) {
      this.teamState.setWizardStep(step);
    }
  }

  goBack(): void {
    const currentStep = this.wizardState().step;
    if (currentStep > 1) {
      this.teamState.setWizardStep(currentStep - 1);
    }
  }

  // Helpers
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  }

  getYearlySavings(tier: typeof TEAM_SUBSCRIPTION_TIERS[0]): number {
    return tier.monthlyPrice * 12 - tier.yearlyPrice;
  }
}

