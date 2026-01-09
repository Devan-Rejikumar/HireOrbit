import { Response } from 'express';
import { injectable } from 'inversify';
import { CookieConfig, CookieNames } from '../../constants/CookieConfig';
import { AppConfig } from '../../config/app.config';

/**
 * Service for handling cookie operations
 * Centralizes all cookie setting and clearing logic
 */
@injectable()
export class CookieService {
  /**
   * Sets access token cookie
   */
  setAccessToken(res: Response, token: string): void {
    res.cookie(CookieNames.ACCESS_TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
      maxAge: CookieConfig.ACCESS_TOKEN_MAX_AGE,
    });
  }

  /**
   * Sets refresh token cookie
   */
  setRefreshToken(res: Response, token: string): void {
    res.cookie(CookieNames.REFRESH_TOKEN, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
      maxAge: CookieConfig.REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Clears access token cookie
   */
  clearAccessToken(res: Response): void {
    res.clearCookie(CookieNames.ACCESS_TOKEN, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
    });
  }

  /**
   * Clears refresh token cookie
   */
  clearRefreshToken(res: Response): void {
    res.clearCookie(CookieNames.REFRESH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
    });
  }
}

