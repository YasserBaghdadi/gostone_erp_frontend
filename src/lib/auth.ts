import Cookies from 'js-cookie';

// Cookie Names (Secure naming)
const ACCESS_TOKEN_KEY = '__bgh_at';
const REFRESH_TOKEN_KEY = '__bgh_rt';

const isProduction = window.location.protocol === 'https:';

// Cookie Options for Security
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  secure: isProduction, // Only enforce HTTPS in production
  sameSite: 'lax',
  path: '/',
};

// Token Management
export const authTokens = {
  // Get Access Token
  getAccessToken: (): string | undefined => {
    return Cookies.get(ACCESS_TOKEN_KEY);
  },
  
  // Get Refresh Token
  getRefreshToken: (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },
  
  // Set Tokens
  setTokens: (accessToken: string, refreshToken: string): void => {
    // Access token expires in 7 days (client-side), validation handled by backend (401)
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
      ...COOKIE_OPTIONS,
      expires: 7, // 7 days
    });
    
    // Refresh token expires in 7 days
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
      ...COOKIE_OPTIONS,
      expires: 7,
    });
  },
  
  // Clear Tokens (Logout)
  clearTokens: (): void => {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
  },
  
  // Check if user has valid tokens
  hasTokens: (): boolean => {
    return Boolean(Cookies.get(ACCESS_TOKEN_KEY));
  },
};

// Login Request Type
export interface LoginRequest {
  phone_number: string;
  password: string;
}

// Login Response Type
export interface LoginResponse {
  access: string;
  refresh: string;
}

// Refresh Request Type
export interface RefreshRequest {
  refresh: string;
}

// Refresh Response Type
export interface RefreshResponse {
  access: string;
}

export interface User {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean; // boolean in JSON
  permission_groups: {
    id: number;
    name: string;
  }[];
  avatar?: string;
  username?: string; // Keep optional if not in JSON but used elsewhere
  role?: string; // Keep optional if not in JSON
}

export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
}

export interface ChangePasswordRequest {
  new_password: string;
  current_password: string;
}
