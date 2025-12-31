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

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthResponse {
  requiresTwoFactor?: boolean;
  twoFactorMethods?: string[];
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
  email: string
}

export interface SocialAuthProvider {
  provider: 'google' | 'facebook' | 'github';
  accessToken: string;
}

export enum AuthErrorCodes {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  InvalidToken = 'INVALID_TOKEN',
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidRequest = 'INVALID_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  ServerError = 'SERVER_ERROR',
  UnknownError = 'UNKNOWN_ERROR',
  USER_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'PASSWORD_TOO_WEAK',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED'
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
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface LoginError {
  code: LoginErrorCodes;
  message: string;
  retryAfter?: number;
}
