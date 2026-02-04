/**
 * User Dashboard Models
 * Comprehensive type definitions for the user dashboard module
 */

// ==================== User Profile ====================

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  phoneNumber?: string;
  country?: string;
  profession?: string;
  organization?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country?: string;
  profession?: string;
  organization?: string;
}

// ==================== Dashboard Stats ====================

export interface StorageInfo {
  storageUsed: number;
  storageLimit: number;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  percentageUsed: number;
  ocrPageLimit: number;
  ocrPagesUsed: number;
  ocrPagesRemaining: number;
  ocrUnlimited: boolean;
  documentUploadLimit: number;
  documentsUploaded: number;
  documentsRemaining: number;
  documentsUnlimited: boolean;
  subscriptionPlan: string;
  billingInterval: string;
  quotaResetDate: string;
  documentQuotaExceeded: boolean;
  ocrQuotaExceeded: boolean;
  quotaExceeded: boolean;
  remainingStorage: number;
  unlimited: boolean;
}

export interface DashboardStats {
  // Documents
  totalDocuments: number;
  documentsThisMonth: number;
  documentsUploaded: number;
  documentUploadLimit: number;
  documentsRemaining: number;
  documentsUnlimited: boolean;
  documentQuotaExceeded: boolean;

  // OCR
  ocrPagesUsed: number;
  ocrPagesLimit: number;
  ocrPagesRemaining: number;
  ocrUnlimited: boolean;
  ocrQuotaExceeded: boolean;

  // Storage
  storageUsed: number;
  storageLimit: number;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  storagePercentageUsed: number;
  remainingStorage: number;

  // Subscription
  subscriptionPlan: string;
  billingInterval: string;
  quotaExceeded: boolean;
  unlimited: boolean;

  // Teams & Collaboration
  collaborations: number;
  teamsCount: number;

  // Tasks (for future use)
  pendingTasks: number;
  completedTasks: number;
}

export interface StatCard {
  id: string;
  title: string;
  value: number | string;
  icon: StatIconType;
  color: StatColorType;
  change?: {
    value: string;
    percentage: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  subtitle?: string;
  link?: string;
}

export type StatIconType =
  | 'document'
  | 'ocr'
  | 'storage'
  | 'team'
  | 'activity'
  | 'task'
  | 'chart'
  | 'clock';

export type StatColorType =
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple'
  | 'red'
  | 'indigo'
  | 'teal'
  | 'pink';

// ==================== Activity ====================

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  document?: {
    id: string;
    name: string;
    collectionId?: string;
  };
}

export type ActivityType =
  | 'document_created'
  | 'document_edited'
  | 'document_deleted'
  | 'document_shared'
  | 'ocr_completed'
  | 'ocr_failed'
  | 'file_uploaded'
  | 'file_downloaded'
  | 'team_joined'
  | 'team_invited'
  | 'subscription_changed'
  | 'payment_completed'
  | 'login'
  | 'password_changed';

// ==================== Recent Collections ====================

export interface RecentCollection {
  id: string;
  collectionStatus: 'pending' | 'processing' | 'processed' | 'completed' | 'failed' | 'failed_ocr';
  fileCount: number;
  createdAt: string;
  updatedAt: string;
  uploadTimestamp: string;
}

// ==================== Quick Actions ====================

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconPath?: string;
  route?: string;
  action?: string;
  color: string;
  enabled: boolean;
  badge?: string | number;
}

// ==================== Notifications ====================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'system';

export interface NotificationPreferences {
  email: {
    documentShared: boolean;
    ocrCompleted: boolean;
    teamInvitations: boolean;
    paymentReminders: boolean;
    securityAlerts: boolean;
    weeklyDigest: boolean;
    marketingUpdates: boolean;
  };
  push: {
    documentShared: boolean;
    ocrCompleted: boolean;
    teamInvitations: boolean;
    paymentReminders: boolean;
    securityAlerts: boolean;
  };
  sms: {
    securityAlerts: boolean;
    paymentReminders: boolean;
  };
}

// ==================== Subscription & Billing ====================

export interface Subscription {
  id: string;
  planId: string;
  planName: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: 'MONTHLY' | 'YEARLY';
  price: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  features: SubscriptionFeature[];
}

export type SubscriptionPlan =
  | 'FREE'
  | 'STARTER'
  | 'PRO'
  | 'BUSINESS'
  | 'TEAM_PREMIUM'
  | 'TEAM_ENTERPRISE';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAUSED';

export interface SubscriptionFeature {
  name: string;
  included: boolean;
  limit?: number;
  used?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: BillingAddress;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  date: string;
  dueDate?: string;
  pdfUrl?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ==================== Security ====================

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethods: TwoFactorMethod[];
  loginHistory: LoginHistoryEntry[];
  activeSessions: Session[];
  passwordLastChanged?: string;
  securityQuestions: boolean;
}

export type TwoFactorMethod = 'authenticator' | 'sms' | 'email';

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  location?: string;
  device: string;
  browser: string;
  status: 'success' | 'failed';
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  location?: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ==================== Teams ====================

export interface Team {
  id: string;
  name: string;
  description?: string;
  teamCode: string;
  subscriptionType: 'TEAM_PREMIUM' | 'TEAM_ENTERPRISE';
  subscriptionStatus: SubscriptionStatus;
  role: TeamRole;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  isOwner: boolean;
}

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// ==================== Documents Summary ====================

export interface DocumentSummary {
  totalCount: number;
  recentDocuments: RecentDocument[];
  byStatus: {
    processed: number;
    processing: number;
    pending: number;
    failed: number;
  };
  byType: {
    pdf: number;
    image: number;
    word: number;
    other: number;
  };
}

export interface RecentDocument {
  id: string;
  name: string;
  collectionId: string;
  type: string;
  size: number;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  thumbnailUrl?: string;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ==================== Dashboard State ====================

export interface DashboardState {
  profile: UserProfile | null;
  stats: DashboardStats | null;
  activities: Activity[];
  notifications: Notification[];
  subscription: Subscription | null;
  teams: Team[];
  documents: DocumentSummary | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

