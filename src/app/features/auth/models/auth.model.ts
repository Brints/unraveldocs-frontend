export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

export interface LoginResponse extends AuthResponse {}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface SocialAuthProvider {
  provider: 'google' | 'facebook' | 'github';
  accessToken: string;
}

export enum AuthErrorCodes {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
  InvalidToken = 'INVALID_TOKEN',
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidRequest = 'INVALID_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  ServerError = 'SERVER_ERROR',
  UnknownError = 'UNKNOWN_ERROR',
  PasswordTooWeak = 'PASSWORD_TOO_WEAK',
  EmailNotVerified = 'EMAIL_NOT_VERIFIED'
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
