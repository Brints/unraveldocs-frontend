export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  role?: string;
  lastLogin?: string;
  isActive?: boolean;
  isVerified?: boolean;
  emailVerified?: boolean;
  termsAccepted?: boolean;
  marketingOptIn?: boolean;
  isPlatformAdmin?: boolean;
  isOrganizationAdmin?: boolean;
  country?: string;
  profession?: string;
  organization?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

/**
 * Generic API response wrapper used by the backend
 */
export interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeToMarketing?: boolean;
  profession?: string;
  organization?: string;
  country: string;
}

/**
 * Login request — rememberMe is UI-only (not sent to API)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response from the API (inside data wrapper).
 * Refresh token is set as an HttpOnly cookie by the server — NOT in the body.
 * User profile must be fetched separately via GET /api/v1/user/me.
 */
export interface LoginData {
  userId: string;
  accessToken: string;
  tokenType: string;
  accessExpiresIn: number;
}

/**
 * Refresh token response from the API (inside data wrapper).
 * New refresh token is set as an HttpOnly cookie by the server.
 */
export interface RefreshTokenData {
  accessToken: string;
  tokenType: string;
  accessExpiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
  email: string;
}

export interface SocialAuthProvider {
  provider: 'google' | 'facebook' | 'github';
  accessToken: string;
}

/**
 * Error codes matching the backend API responses
 */
export enum AuthErrorCodes {
  // Login errors
  InvalidCredentials = 'INVALID_CREDENTIALS',
  AccountDeactivated = 'ACCOUNT_DEACTIVATED',
  AccountNotVerified = 'ACCOUNT_NOT_VERIFIED',
  AccountLocked = 'ACCOUNT_LOCKED',

  // Token errors
  TokenMissing = 'TOKEN_MISSING',
  TokenInvalid = 'TOKEN_INVALID',
  TokenExpired = 'TOKEN_EXPIRED',

  // Email verification errors
  EmailAlreadyVerified = 'EMAIL_ALREADY_VERIFIED',
  VerificationFailed = 'VERIFICATION_FAILED',

  // General errors
  InvalidRequest = 'INVALID_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  UserNotFound = 'USER_NOT_FOUND',
  USER_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'PASSWORD_TOO_WEAK',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ServerError = 'SERVER_ERROR',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface AuthError {
  message: string;
  code: AuthErrorCodes;
  field?: string;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

export interface PasswordResetValidation {
  token: string;
  isValid: boolean;
  email?: string;
  expiresAt?: string;
}

export enum LoginErrorCodes {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  SERVER_ERROR = 'SERVER_ERROR',
}

export interface LoginError {
  code: LoginErrorCodes;
  message: string;
  retryAfter?: number;
}
