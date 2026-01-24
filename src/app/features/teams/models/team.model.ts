/**
 * Team Models
 * Type definitions for team management
 */

// ==================== Team Types ====================

export type SubscriptionType = 'TEAM_PREMIUM' | 'TEAM_ENTERPRISE';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
export type TeamMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type PaymentGateway = 'stripe' | 'paystack';

// ==================== Team ====================

/**
 * Team model - maps to API response
 * Note: API may return fields as `owner`, `active`, `closed`, `verified` (without "is" prefix)
 * or with the "is" prefix depending on context. We normalize these in the service layer.
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  teamCode: string;
  subscriptionType: SubscriptionType | string;  // API may return "Team Premium" or "TEAM_PREMIUM"
  billingCycle: BillingCycle | string;  // API may return "Monthly" or "MONTHLY"
  subscriptionStatus: SubscriptionStatus | string;  // API may return "Trial" or "TRIALING"
  subscriptionPrice: number;
  currency: string;
  isActive: boolean;
  isVerified: boolean;
  isClosed: boolean;
  autoRenew: boolean;
  trialEndsAt?: string | null;
  nextBillingDate?: string | null;
  subscriptionEndsAt?: string | null;
  cancellationRequestedAt?: string | null;
  createdAt?: string | null;
  currentMemberCount: number;
  maxMembers: number;
  monthlyDocumentLimit: number;
  isOwner: boolean;
}

/**
 * Raw API response for team - used to transform to Team interface
 */
export interface TeamApiData {
  id: string;
  name: string;
  description?: string;
  teamCode: string;
  subscriptionType: string;
  billingCycle: string;
  subscriptionStatus: string;
  subscriptionPrice: number;
  currency: string;
  active?: boolean;
  isActive?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  closed?: boolean;
  isClosed?: boolean;
  autoRenew: boolean;
  trialEndsAt?: string | null;
  nextBillingDate?: string | null;
  subscriptionEndsAt?: string | null;
  cancellationRequestedAt?: string | null;
  createdAt?: string | null;
  currentMemberCount: number;
  maxMembers: number;
  monthlyDocumentLimit: number;
  owner?: boolean;
  isOwner?: boolean;
}

export interface TeamSummary {
  id: string;
  name: string;
  description?: string;
  teamCode: string;
  subscriptionType: SubscriptionType | string;
  subscriptionStatus: SubscriptionStatus | string;
  billingCycle?: BillingCycle | string;
  subscriptionPrice?: number;
  currency?: string;
  currentMemberCount: number;
  maxMembers: number;
  monthlyDocumentLimit?: number;
  isOwner: boolean;
  isActive?: boolean;
  autoRenew?: boolean;
  trialEndsAt?: string | null;
  nextBillingDate?: string | null;
  subscriptionEndsAt?: string | null;
  cancellationRequestedAt?: string | null;
  createdAt?: string | null;
}

// ==================== Team Member ====================

export interface TeamMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: TeamMemberRole;
  joinedAt: string | null;
  profilePicture?: string;
}

// ==================== Team Invitation ====================

export interface TeamInvitation {
  id: string;
  email: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  expiresAt: string;
}

// ==================== Create Team Request ====================

export interface InitiateTeamRequest {
  name: string;
  description?: string;
  subscriptionType: SubscriptionType;
  billingCycle: BillingCycle;
  paymentGateway: PaymentGateway;
  paymentToken?: string;
}

export interface VerifyTeamOtpRequest {
  otp: string;
}

// ==================== Team Actions ====================

export interface AddMemberRequest {
  email: string;
}

export interface BatchRemoveMembersRequest {
  memberIds: string[];
}

export interface SendInvitationRequest {
  email: string;
}

// ==================== Subscription Tiers ====================

export interface TeamSubscriptionTier {
  type: SubscriptionType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxMembers: number;
  documentLimit: number | 'Unlimited';
  features: string[];
  enterpriseFeatures?: string[];
}

export const TEAM_SUBSCRIPTION_TIERS: TeamSubscriptionTier[] = [
  {
    type: 'TEAM_PREMIUM',
    name: 'Team Premium',
    monthlyPrice: 29,
    yearlyPrice: 290,
    maxMembers: 10,
    documentLimit: 200,
    features: [
      'Up to 10 team members',
      '200 documents per month',
      'Shared document library',
      'Team activity dashboard',
      'Email support',
      '10-day free trial'
    ]
  },
  {
    type: 'TEAM_ENTERPRISE',
    name: 'Team Enterprise',
    monthlyPrice: 79,
    yearlyPrice: 790,
    maxMembers: 15,
    documentLimit: 'Unlimited',
    features: [
      'Up to 15 team members',
      'Unlimited documents',
      'Shared document library',
      'Team activity dashboard',
      'Priority support',
      '10-day free trial'
    ],
    enterpriseFeatures: [
      'Admin role promotion',
      'Email invitations',
      'Advanced analytics',
      'API access'
    ]
  }
];

// ==================== API Response ====================

export interface TeamApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

