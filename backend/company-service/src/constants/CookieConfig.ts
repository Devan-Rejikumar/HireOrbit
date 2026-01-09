/**
 * Centralized cookie configuration constants
 * Cookie maxAge values are configurable via environment variables with sensible defaults
 */

// Cookie maxAge values in milliseconds (configurable via .env)
export const CookieConfig = {
  ACCESS_TOKEN_MAX_AGE: parseInt(
    process.env.ACCESS_TOKEN_MAX_AGE || '900000', 
    10,
  ),
  REFRESH_TOKEN_MAX_AGE: parseInt(
    process.env.REFRESH_TOKEN_MAX_AGE || '604800000', 
    10,
  ),
} as const;

export const CookieNames = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

