/**
 * Push Notification Models
 * Type definitions based on Push Notification API documentation
 */

// ==================== Device Types ====================

export type DeviceType = 'ANDROID' | 'IOS' | 'WEB';

export interface RegisterDeviceRequest {
  deviceToken: string;
  deviceType: DeviceType;
  deviceName?: string;
}

export interface Device {
  id: string;
  deviceToken: string;
  deviceType: DeviceType;
  deviceName: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

// ==================== Notification Types ====================

export type NotificationType =
  // Document Events
  | 'DOCUMENT_UPLOAD_SUCCESS'
  | 'DOCUMENT_UPLOAD_FAILED'
  | 'DOCUMENT_DELETED'
  // OCR Events
  | 'OCR_PROCESSING_STARTED'
  | 'OCR_PROCESSING_COMPLETED'
  | 'OCR_PROCESSING_FAILED'
  // Storage Events
  | 'STORAGE_WARNING_80'
  | 'STORAGE_WARNING_90'
  | 'STORAGE_WARNING_95'
  | 'STORAGE_LIMIT_REACHED'
  // Payment Events
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  // Subscription Events
  | 'SUBSCRIPTION_EXPIRING_7_DAYS'
  | 'SUBSCRIPTION_EXPIRING_3_DAYS'
  | 'SUBSCRIPTION_EXPIRING_1_DAY'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'TRIAL_EXPIRING_SOON'
  | 'TRIAL_EXPIRED'
  // Team Events
  | 'TEAM_INVITATION_RECEIVED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'TEAM_ROLE_CHANGED'
  // System Events
  | 'SYSTEM_ANNOUNCEMENT'
  | 'WELCOME';

export type NotificationCategory =
  | 'document'
  | 'ocr'
  | 'storage'
  | 'payment'
  | 'subscription'
  | 'team'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  typeDisplayName: string;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

// ==================== Paginated Response ====================

export interface PageableSort {
  sorted: boolean;
  direction: 'ASC' | 'DESC';
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
}

export interface PaginatedNotifications {
  content: Notification[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ==================== Notification Preferences ====================

export interface NotificationPreferences {
  id: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  documentNotifications: boolean;
  ocrNotifications: boolean;
  paymentNotifications: boolean;
  storageNotifications: boolean;
  subscriptionNotifications: boolean;
  teamNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  pushEnabled: boolean;
  emailEnabled: boolean;
  documentNotifications: boolean;
  ocrNotifications: boolean;
  paymentNotifications: boolean;
  storageNotifications: boolean;
  subscriptionNotifications: boolean;
  teamNotifications: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ==================== Error Response ====================

export interface NotificationErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ==================== Utility Types ====================

export interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

export const NOTIFICATION_TYPE_DISPLAY_NAMES: Record<NotificationType, string> = {
  // Document Events
  DOCUMENT_UPLOAD_SUCCESS: 'Document Upload Success',
  DOCUMENT_UPLOAD_FAILED: 'Document Upload Failed',
  DOCUMENT_DELETED: 'Document Deleted',
  // OCR Events
  OCR_PROCESSING_STARTED: 'OCR Processing Started',
  OCR_PROCESSING_COMPLETED: 'OCR Processing Completed',
  OCR_PROCESSING_FAILED: 'OCR Processing Failed',
  // Storage Events
  STORAGE_WARNING_80: 'Storage Warning 80%',
  STORAGE_WARNING_90: 'Storage Warning 90%',
  STORAGE_WARNING_95: 'Storage Warning 95%',
  STORAGE_LIMIT_REACHED: 'Storage Limit Reached',
  // Payment Events
  PAYMENT_SUCCESS: 'Payment Success',
  PAYMENT_FAILED: 'Payment Failed',
  PAYMENT_REFUNDED: 'Payment Refunded',
  // Subscription Events
  SUBSCRIPTION_EXPIRING_7_DAYS: 'Subscription Expiring in 7 Days',
  SUBSCRIPTION_EXPIRING_3_DAYS: 'Subscription Expiring in 3 Days',
  SUBSCRIPTION_EXPIRING_1_DAY: 'Subscription Expiring Tomorrow',
  SUBSCRIPTION_EXPIRED: 'Subscription Expired',
  SUBSCRIPTION_RENEWED: 'Subscription Renewed',
  SUBSCRIPTION_UPGRADED: 'Subscription Upgraded',
  SUBSCRIPTION_DOWNGRADED: 'Subscription Downgraded',
  TRIAL_EXPIRING_SOON: 'Trial Expiring Soon',
  TRIAL_EXPIRED: 'Trial Expired',
  // Team Events
  TEAM_INVITATION_RECEIVED: 'Team Invitation Received',
  TEAM_MEMBER_ADDED: 'Team Member Added',
  TEAM_MEMBER_REMOVED: 'Team Member Removed',
  TEAM_ROLE_CHANGED: 'Team Role Changed',
  // System Events
  SYSTEM_ANNOUNCEMENT: 'System Announcement',
  WELCOME: 'Welcome',
};

export const NOTIFICATION_CATEGORY_MAP: Record<NotificationType, NotificationCategory> = {
  DOCUMENT_UPLOAD_SUCCESS: 'document',
  DOCUMENT_UPLOAD_FAILED: 'document',
  DOCUMENT_DELETED: 'document',
  OCR_PROCESSING_STARTED: 'ocr',
  OCR_PROCESSING_COMPLETED: 'ocr',
  OCR_PROCESSING_FAILED: 'ocr',
  STORAGE_WARNING_80: 'storage',
  STORAGE_WARNING_90: 'storage',
  STORAGE_WARNING_95: 'storage',
  STORAGE_LIMIT_REACHED: 'storage',
  PAYMENT_SUCCESS: 'payment',
  PAYMENT_FAILED: 'payment',
  PAYMENT_REFUNDED: 'payment',
  SUBSCRIPTION_EXPIRING_7_DAYS: 'subscription',
  SUBSCRIPTION_EXPIRING_3_DAYS: 'subscription',
  SUBSCRIPTION_EXPIRING_1_DAY: 'subscription',
  SUBSCRIPTION_EXPIRED: 'subscription',
  SUBSCRIPTION_RENEWED: 'subscription',
  SUBSCRIPTION_UPGRADED: 'subscription',
  SUBSCRIPTION_DOWNGRADED: 'subscription',
  TRIAL_EXPIRING_SOON: 'subscription',
  TRIAL_EXPIRED: 'subscription',
  TEAM_INVITATION_RECEIVED: 'team',
  TEAM_MEMBER_ADDED: 'team',
  TEAM_MEMBER_REMOVED: 'team',
  TEAM_ROLE_CHANGED: 'team',
  SYSTEM_ANNOUNCEMENT: 'system',
  WELCOME: 'system',
};

