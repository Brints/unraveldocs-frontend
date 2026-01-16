# Paystack Payment Integration - Implementation Guide

## Overview

This document describes the Paystack payment gateway integration for UnravelDocs. The implementation provides a complete billing flow within the existing billing-settings component at `/settings/billing`.

## Architecture

### Files Created/Modified

```
src/app/features/payments/
├── models/
│   └── paystack.model.ts          # Paystack type definitions & utilities
├── services/
│   ├── paystack-api.service.ts    # HTTP service for Paystack API calls
│   ├── paystack-api.service.spec.ts
│   ├── paystack-state.service.ts  # State management for billing
│   └── paystack-state.service.spec.ts
├── pages/
│   └── paystack-callback/
│       └── paystack-callback.component.ts  # Payment callback handler
└── paystack/
    └── index.ts                   # Barrel export file

src/app/features/user/
├── user.routes.ts                 # Updated with callback route
└── components/
    └── billing-settings/
        ├── billing-settings.component.ts   # Updated with Paystack integration
        └── billing-settings.component.html # Updated UI
```

### Routes

- `/settings/billing` - Main billing page (existing)
- `/settings/billing/paystack/callback` - Paystack payment callback handler

## Data Sources

### Current Subscription Info
The current subscription plan and usage comes from the `/api/v1/storage` endpoint:

```json
{
  "subscriptionPlan": "Business_Yearly",
  "billingInterval": "Yearly",
  "documentsUploaded": 7,
  "documentUploadLimit": 6000,
  "ocrPagesUsed": 0,
  "ocrPageLimit": 30000,
  ...
}
```

### Plans & Pricing
Plans with currency conversion are fetched from `/api/v1/plans?currency=XXX`:

```json
{
  "individualPlans": [...],
  "teamPlans": [...],
  "displayCurrency": "NGN",
  "exchangeRateTimestamp": "..."
}
```

## Payment Flow

### 1. User Visits Billing Page

1. User navigates to `/settings/billing`
2. Component loads user data from `AuthService`
3. Component calls `paystackState.initialize(userEmail)`
4. Component calls `paystackState.loadBillingData('NGN')` which:
   - Fetches plans from `/api/v1/plans?currency=NGN`
   - Fetches storage info from `/api/v1/storage`
   - Fetches payment history from Paystack API

### 2. User Selects a Plan

1. User can toggle between Individual/Team plans
2. User can toggle between Monthly/Yearly billing
3. User can change display currency (NGN, GHS, ZAR, KES, USD)
4. User clicks on a plan → confirmation modal opens

### 3. Checkout Process

```typescript
// In PaystackStateService.startCheckout()
1. Validate selected plan and user email
2. Get amount from plan price (already converted to selected currency)
3. Convert to kobo (amount * 100)
4. Generate callback URL: window.location.origin + '/settings/billing/paystack/callback'
5. Call API: POST /api/v1/paystack/transaction/initialize
6. Store reference in sessionStorage for verification
7. Redirect user to Paystack authorizationUrl
```

### 4. Payment at Paystack

1. User completes payment on Paystack's hosted page
2. Paystack redirects to `/settings/billing/paystack/callback?reference=xxx`

### 5. Payment Verification

```typescript
// In PaystackCallbackComponent
1. Extract reference from URL params or sessionStorage
2. Call API: GET /api/v1/paystack/transaction/verify/{reference}
3. Display success/error based on transaction status
4. Clear sessionStorage
5. Redirect to /settings/billing with success flag
```

### 6. Webhook Processing (Backend)

1. Paystack sends webhook to `/api/v1/paystack/webhook`
2. Backend verifies signature and processes event
3. For `charge.success`: creates subscription, generates receipt
4. Receipt email sent to user

## Subscription Plans

Plans are fetched dynamically from the API. Example structure:

| Plan            | Monthly (USD) | Yearly (USD) | Docs/Month | OCR Pages |
|-----------------|---------------|--------------|------------|-----------|
| Free            | $0            | -            | 10         | 50        |
| Starter         | $9            | $90          | 30         | 150       |
| Pro             | $19           | $190         | 100        | 500       |
| Business        | $49           | $490         | 500        | 2,500     |
| Team Premium    | $29           | $290         | 200        | -         |
| Team Enterprise | $79           | $790         | Unlimited  | -         |

## API Endpoints Used

### Plans API (PricingService)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans?currency=XXX` | Get plans with pricing in currency |
| GET | `/plans/currencies` | Get supported currencies |

### Storage API (UserApiService)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/storage` | Get current subscription & usage |

### Paystack Transaction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/paystack/transaction/initialize` | Start a new payment |
| GET | `/paystack/transaction/verify/{reference}` | Verify payment status |
| GET | `/paystack/transaction/history` | Get payment history |

### Paystack Subscription Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/paystack/subscription/active` | Get current Paystack subscription |
| POST | `/paystack/subscription/{code}/enable` | Reactivate subscription |
| POST | `/paystack/subscription/{code}/disable` | Cancel subscription |

## State Management

The `PaystackStateService` uses Angular signals for reactive state:

```typescript
// Key state signals
userEmail: Signal<string>
storageInfo: Signal<StorageInfo | null>        // From /storage API
selectedPlanId: Signal<string | null>
billingInterval: Signal<'monthly' | 'yearly'>
paymentHistory: Signal<PaystackPaymentHistoryItem[]>
isLoading: Signal<boolean>
isProcessing: Signal<boolean>
error: Signal<string | null>
successMessage: Signal<string | null>

// Computed from PricingService
individualPlans: Signal<IndividualPlan[]>
teamPlans: Signal<TeamPlan[]>
selectedCurrency: Signal<string>

// Computed properties
currentPlanName: computed from storageInfo
currentBillingInterval: computed from storageInfo
filteredIndividualPlans: filtered by billing interval
hasActiveSubscription: true if not FREE plan
```

## Key Features

### Multi-Currency Support

Supports African currencies for Paystack:
- NGN (Nigerian Naira) - Default
- GHS (Ghanaian Cedi)
- ZAR (South African Rand)
- KES (Kenyan Shilling)
- USD (US Dollar)

Plans are fetched with prices converted to the selected currency via the `/plans?currency=XXX` endpoint.

### Billing Interval Toggle

Users can switch between monthly and yearly billing. The filtered plans are displayed based on the selected interval.

### Plan Comparison

- Individual plans for single users
- Team plans for organizations
- Visual indication of current plan
- Popular plan highlighting
- Feature comparison lists
- Usage limits display

### Subscription Management

- View current subscription from storage API
- View usage (documents, OCR pages, storage)
- Cancel Paystack subscription
- Reactivate cancelled subscription
- View payment history

## Usage Example

```typescript
import { PaystackStateService } from '@features/payments/services/paystack-state.service';

@Component({...})
export class BillingSettingsComponent {
  private paystackState = inject(PaystackStateService);
  
  ngOnInit() {
    // Initialize with user email
    this.paystackState.initialize('user@example.com');
    
    // Load billing data with NGN currency
    this.paystackState.loadBillingData('NGN');
  }
  
  selectPlan(planId: string) {
    this.paystackState.selectPlan(planId);
    // Show confirmation modal...
  }
  
  confirmCheckout() {
    this.paystackState.startCheckout(); // Redirects to Paystack
  }
}
```

## Error Handling

All API calls include error handling:
- Network errors display user-friendly messages
- Failed transactions show Paystack's gateway response
- Session storage used to recover transaction reference if redirect fails

## Future Enhancements

1. **PayPal Integration** - Similar flow for non-African users
2. **Stripe Integration** - Credit card support worldwide
3. **Invoice Downloads** - PDF receipt generation
4. **Promo Codes** - Discount code application at checkout

