/**
 * Plan Pricing Models
 * Type definitions for public pricing API
 */

// ==================== Currency ====================

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface CurrenciesResponse {
  currencies: Currency[];
  totalCount: number;
}

// ==================== Price ====================

export interface ConvertedPrice {
  originalAmountUsd: number;
  convertedAmount: number;
  currency: string;
  formattedPrice: string;
  exchangeRate: number;
  rateTimestamp: string;
}

// ==================== Individual Plan ====================

export interface IndividualPlan {
  planId: string;
  planName: string;
  displayName: string;
  billingInterval: 'MONTH' | 'YEAR';
  price: ConvertedPrice;
  documentUploadLimit: number;
  ocrPageLimit: number;
  isActive: boolean;
  features: string[];
}

// ==================== Team Plan ====================

export interface TeamPlan {
  planId: string;
  planName: string;
  displayName: string;
  description?: string;
  monthlyPrice: ConvertedPrice;
  yearlyPrice: ConvertedPrice;
  maxMembers: number;
  monthlyDocumentLimit: number;
  hasAdminPromotion: boolean;
  hasEmailInvitations: boolean;
  trialDays: number;
  isActive: boolean;
  features: string[];
}

// ==================== Plans Response ====================

export interface PlansResponse {
  individualPlans: IndividualPlan[];
  teamPlans: TeamPlan[];
  displayCurrency: string;
  exchangeRateTimestamp: string;
}

// ==================== Popular Currencies ====================

export const POPULAR_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' }
];

