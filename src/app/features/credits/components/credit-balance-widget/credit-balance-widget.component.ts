import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CreditStateService } from '../../services/credit-state.service';

@Component({
  selector: 'app-credit-balance-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'credit-balance-widget.component.html',
  styleUrl: 'credit-balance-widget.component.css'
})
export class CreditBalanceWidgetComponent implements OnInit {
  private readonly creditState = inject(CreditStateService);

  readonly creditBalance = this.creditState.creditBalance;
  readonly totalPurchased = this.creditState.totalPurchased;
  readonly totalUsed = this.creditState.totalUsed;
  readonly isLowBalance = this.creditState.isLowBalance;

  ngOnInit(): void {
    this.creditState.loadBalance();
  }
}

