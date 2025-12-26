/**
 * Centralized cookie configuration constants
 * Cookie maxAge values are configurable via environment variables with sensible defaults
 */

// Cookie maxAge values in milliseconds (configurable via .env)
export const CookieConfig = {
  COMPANY_ACCESS_TOKEN_MAX_AGE: parseInt(
    process.env.COMPANY_ACCESS_TOKEN_MAX_AGE || '900000', // 15 minutes
    10,
  ),
  COMPANY_REFRESH_TOKEN_MAX_AGE: parseInt(
    process.env.COMPANY_REFRESH_TOKEN_MAX_AGE || '604800000', // 7 days
    10,
  ),
} as const;

export const CookieNames = {
  COMPANY_ACCESS_TOKEN: 'companyAccessToken',
  COMPANY_REFRESH_TOKEN: 'companyRefreshToken',
} as const;

