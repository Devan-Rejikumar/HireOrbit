import { Response } from 'express';
import { injectable } from 'inversify';
import { CookieConfig, CookieNames } from '../../constants/CookieConfig';
import { AppConfig } from '../../config/app.config';

@injectable()
export class CookieService {
  setAccessToken(res: Response, token: string): void {
    res.cookie(CookieNames.ACCESS_TOKEN, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
      maxAge: CookieConfig.ACCESS_TOKEN_MAX_AGE,
    });
  }

  setRefreshToken(res: Response, token: string): void {
    res.cookie(CookieNames.REFRESH_TOKEN, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
      maxAge: CookieConfig.REFRESH_TOKEN_MAX_AGE,
    });
  }

  clearAccessToken(res: Response): void {
    res.clearCookie(CookieNames.ACCESS_TOKEN, {
      secure: true,
      sameSite: 'none',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(CookieNames.REFRESH_TOKEN, {
      secure: true,
      sameSite: 'none',
      domain: AppConfig.COOKIE_DOMAIN,
      path: '/',
    });
  }
}
