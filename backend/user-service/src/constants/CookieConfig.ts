/**
 * Centralized cookie configuration constants
 * Cookie maxAge values are configurable via environment variables with sensible defaults
 */
export const CookieConfig = {
  ACCESS_TOKEN_MAX_AGE: parseInt(
    process.env.ACCESS_TOKEN_MAX_AGE || '900000',
    10
  ),
  REFRESH_TOKEN_MAX_AGE: parseInt(
    process.env.REFRESH_TOKEN_MAX_AGE || '604800000',
    10
  ),
  TOKEN_MAX_AGE: parseInt(
    process.env.TOKEN_MAX_AGE || '86400000',
    10
  ),
} as const;
  
export const CookieNames = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN: 'token',
} as const;