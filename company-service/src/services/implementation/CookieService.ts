import { Response } from 'express';
import { injectable } from 'inversify';
import { CookieConfig, CookieNames } from '../../constants/CookieConfig';

/**
 * Service for handling cookie operations
 * Centralizes all cookie setting and clearing logic
 */
@injectable()
export class CookieService {
  /**
   * Sets company access token cookie
   */
  setCompanyAccessToken(res: Response, token: string): void {
    res.cookie(CookieNames.COMPANY_ACCESS_TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: 'localhost',
      path: '/',
      maxAge: CookieConfig.COMPANY_ACCESS_TOKEN_MAX_AGE,
    });
  }

  /**
   * Sets company refresh token cookie
   */
  setCompanyRefreshToken(res: Response, token: string): void {
    res.cookie(CookieNames.COMPANY_REFRESH_TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: 'localhost',
      path: '/',
      maxAge: CookieConfig.COMPANY_REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Clears company access token cookie
   */
  clearCompanyAccessToken(res: Response): void {
    res.clearCookie(CookieNames.COMPANY_ACCESS_TOKEN, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  /**
   * Clears company refresh token cookie
   */
  clearCompanyRefreshToken(res: Response): void {
    res.clearCookie(CookieNames.COMPANY_REFRESH_TOKEN, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}

