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
   * Sets access token cookie
   */
  setAccessToken(res: Response, token: string): void {
    res.cookie(CookieNames.ACCESS_TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: 'localhost',
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
      domain: 'localhost',
      path: '/',
      maxAge: CookieConfig.REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Sets admin access token cookie
   */
  setAdminAccessToken(res: Response, token: string): void {
    res.cookie(CookieNames.ADMIN_ACCESS_TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CookieConfig.ADMIN_ACCESS_TOKEN_MAX_AGE,
    });
  }

  /**
   * Sets admin refresh token cookie
   */
  setAdminRefreshToken(res: Response, token: string): void {
    res.cookie(CookieNames.ADMIN_REFRESH_TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CookieConfig.ADMIN_REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Sets a generic token cookie with custom maxAge
   */
  setToken(res: Response, token: string, maxAge: number): void {
    res.cookie(CookieNames.TOKEN, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
    });
  }

  /**
   * Clears a cookie by name
   */
  clearCookie(res: Response, name: string): void {
    res.clearCookie(name, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
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
      path: '/',
    });
  }

  /**
   * Clears admin access token cookie
   */
  clearAdminAccessToken(res: Response): void {
    res.clearCookie(CookieNames.ADMIN_ACCESS_TOKEN, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  /**
   * Clears admin refresh token cookie
   */
  clearAdminRefreshToken(res: Response): void {
    res.clearCookie(CookieNames.ADMIN_REFRESH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}