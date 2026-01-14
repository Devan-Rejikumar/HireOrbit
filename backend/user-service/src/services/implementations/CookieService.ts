import { Response } from 'express';
import { injectable } from 'inversify';
import { CookieConfig, CookieNames } from '../../constants/CookieConfig';
import { AppConfig } from '../../config/app.config';

// Environment-aware cookie settings
// Check for production OR docker environment with non-localhost domain
const isProduction = process.env.NODE_ENV === 'production' || 
  (process.env.NODE_ENV === 'docker' && AppConfig.COOKIE_DOMAIN !== 'localhost' && !AppConfig.COOKIE_DOMAIN.includes('localhost'));

// Only set domain if it's a production domain (not localhost)
const shouldSetDomain = AppConfig.COOKIE_DOMAIN && 
  AppConfig.COOKIE_DOMAIN !== 'localhost' && 
  !AppConfig.COOKIE_DOMAIN.includes('localhost');

/**
 * Service for handling cookie operations
 * Centralizes all cookie setting and clearing logic
 */
@injectable()
export class CookieService {
  /**
   * Gets cookie options based on environment
   */
  private getCookieOptions(maxAge?: number) {
    const options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'none' | 'lax' | 'strict';
      path: string;
      maxAge?: number;
      domain?: string;
    } = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    };
    
    // Only set domain for production environments with non-localhost domain
    if (shouldSetDomain) {
      options.domain = AppConfig.COOKIE_DOMAIN;
    }
    
    if (maxAge !== undefined) {
      options.maxAge = maxAge;
    }
    
    return options;
  }

  /**
   * Sets access token cookie
   */
  setAccessToken(res: Response, token: string): void {
    res.cookie(CookieNames.ACCESS_TOKEN, token, this.getCookieOptions(CookieConfig.ACCESS_TOKEN_MAX_AGE));
  }

  /**
   * Sets refresh token cookie
   */
  setRefreshToken(res: Response, token: string): void {
    res.cookie(CookieNames.REFRESH_TOKEN, token, this.getCookieOptions(CookieConfig.REFRESH_TOKEN_MAX_AGE));
  }


  /**
   * Sets a generic token cookie with custom maxAge
   */
  setToken(res: Response, token: string, maxAge: number): void {
    res.cookie(CookieNames.TOKEN, token, this.getCookieOptions(maxAge));
  }

  /**
   * Clears a cookie by name
   */
  clearCookie(res: Response, name: string): void {
    const options = this.getCookieOptions();
    delete options.maxAge;
    res.clearCookie(name, options);
  }

  /**
   * Clears access token cookie
   */
  clearAccessToken(res: Response): void {
    const options = this.getCookieOptions();
    delete options.maxAge;
    res.clearCookie(CookieNames.ACCESS_TOKEN, options);
  }

  /**
   * Clears refresh token cookie
   */
  clearRefreshToken(res: Response): void {
    const options = this.getCookieOptions();
    delete options.maxAge;
    res.clearCookie(CookieNames.REFRESH_TOKEN, options);
  }

}
