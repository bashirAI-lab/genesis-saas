/**
 * Shared auth types used by both frontend and backend.
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  tokens: AuthTokens;
}

export interface JwtPayload {
  userId: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roles: string[];
}
