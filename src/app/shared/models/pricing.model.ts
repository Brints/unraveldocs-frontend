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
  // Major World Currencies
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  
  // Asia Pacific
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan Renminbi' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'NZD', symbol: '$', name: 'New Zealand Dollar' },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  
  // Americas
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
  
  // Europe (Non-Euro)
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв.', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'LTL', symbol: 'Lt', name: 'Lithuanian Litas' },
  { code: 'LVL', symbol: 'Ls', name: 'Latvian Lats' },
  
  // Middle East
  { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  { code: 'JOD', symbol: 'د.أ', name: 'Jordanian Dinar' },
  
  // Africa
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
  
  // Central Asia
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
];

