import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AccessTokenPayload, RefreshTokenPayload, TokenPair } from '../../types/auth';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../../constants/TimeConstants';
import { logger } from '../../utils/logger';

@injectable()
export class JWTService {
  private readonly _accessTokenSecret = process.env.JWT_SECRET!;
  private readonly _refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET!; 

  generateTokenPair(payload: Omit<AccessTokenPayload, 'userId'> & { userId: string }): TokenPair {
    const tokenId = uuidv4();
    
    const accessTokenPayload: AccessTokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userType: payload.userType
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userType: payload.userType,
      tokenId
    };

    const accessToken = jwt.sign(accessTokenPayload, this._accessTokenSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this._refreshTokenSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });

    return {
      accessToken,
      refreshToken
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this._accessTokenSecret) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    logger.debug('JWTService - Verifying refresh token');
    try {
      const decoded = jwt.verify(token, this._refreshTokenSecret) as RefreshTokenPayload;
      logger.debug('JWTService - Token verified:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tokenId: decoded.tokenId
      });
      return decoded;
    } catch (error) {
      logger.error('JWTService - Token verification failed:', error);
      throw error;
    }
  }

  generateNewAccessToken(refreshTokenPayload: RefreshTokenPayload): string {
    logger.debug('JWTService - Generating new access token:', {
      userId: refreshTokenPayload.userId,
      role: refreshTokenPayload.role
    });
  
    const accessTokenPayload: AccessTokenPayload = {
      userId: refreshTokenPayload.userId,
      email: refreshTokenPayload.email,
      role: refreshTokenPayload.role,
      userType: refreshTokenPayload.userType
    };

    const token = jwt.sign(accessTokenPayload, this._accessTokenSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  
    logger.debug('JWTService - New access token generated');
    return token;
  }
}