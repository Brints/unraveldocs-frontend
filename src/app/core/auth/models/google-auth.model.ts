export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  responseType: 'code' | 'token';
  accessType?: 'online' | 'offline';
  prompt?: 'none' | 'consent' | 'select_account';
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  verified_email: boolean;
}

export interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
  id_token?: string;
}

export interface GoogleSignupRequest {
  googleToken: string;
  marketingConsent?: boolean;
  referralCode?: string;
}

export interface GoogleSignupResponse {
  user: GoogleUser;
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
  requiresAdditionalInfo?: boolean;
  missingFields?: string[];
}

export enum GoogleAuthErrorCodes {
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  POPUP_CLOSED = 'POPUP_CLOSED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CLIENT = 'INVALID_CLIENT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVALID_GRANT = 'INVALID_GRANT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SCOPE_INSUFFICIENT = 'SCOPE_INSUFFICIENT',
  USER_CANCELLED = 'USER_CANCELLED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface GoogleAuthError {
  code: GoogleAuthErrorCodes;
  message: string;
  details?: any;
}
