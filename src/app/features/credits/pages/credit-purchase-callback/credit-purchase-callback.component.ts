import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CreditStateService } from '../../services/credit-state.service';

@Component({
  selector: 'app-credit-purchase-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'credit-purchase-callback.component.html',
  styleUrl: 'credit-purchase-callback.component.css'
})
export class CreditPurchaseCallbackComponent implements OnInit {
  private readonly creditState = inject(CreditStateService);

  isLoading = signal(true);
  isSuccess = signal(false);
  packName = signal('');
  credits = signal('');

  ngOnInit(): void {
    // Retrieve purchase info from session storage
    const reference = sessionStorage.getItem('credit_purchase_reference');
    const pack = sessionStorage.getItem('credit_purchase_pack');
    const creditsStr = sessionStorage.getItem('credit_purchase_credits');

    if (pack) this.packName.set(pack);
    if (creditsStr) this.credits.set(creditsStr);

    // Refresh credit balance
    this.creditState.loadBalance();

    // Simulate verification delay
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSuccess.set(!!reference);

      // Cleanup session storage
      sessionStorage.removeItem('credit_purchase_reference');
      sessionStorage.removeItem('credit_purchase_pack');
      sessionStorage.removeItem('credit_purchase_credits');
      sessionStorage.removeItem('credit_purchase_gateway');
    }, 2000);
  }
}
