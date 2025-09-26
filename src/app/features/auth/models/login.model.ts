import { User } from './auth.model';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor?: boolean;
  twoFactorMethods?: string[];
}

export interface SocialLoginRequest {
  provider: 'google' | 'github';
  redirectUrl?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export enum LoginErrorCodes {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INVALID_TWO_FACTOR = 'INVALID_TWO_FACTOR',
  PASSWORD_EXPIRED = 'PASSWORD_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface LoginError {
  code: LoginErrorCodes;
  message: string;
  details?: any;
  retryAfter?: number; // seconds until next attempt allowed
}
