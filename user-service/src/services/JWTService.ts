import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AccessTokenPayload, RefreshTokenPayload, TokenPair } from '../types/auth';

@injectable()
export class JWTService {
  private readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'supersecret';
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; 
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; 

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

    const accessToken = jwt.sign(accessTokenPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });

    return {
      accessToken,
      refreshToken
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
  console.log('JWTService - Verifying refresh token');
  try {
    const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    console.log('JWTService - Token verified:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tokenId: decoded.tokenId
    });
    return decoded;
  } catch (error) {
    console.error('❌ JWTService - Token verification failed:', error);
    throw error;
  }
}

  generateNewAccessToken(refreshTokenPayload: RefreshTokenPayload): string {
  console.log('JWTService - Generating new access token:', {
    userId: refreshTokenPayload.userId,
    role: refreshTokenPayload.role
  });
  
  const accessTokenPayload: AccessTokenPayload = {
    userId: refreshTokenPayload.userId,
    email: refreshTokenPayload.email,
    role: refreshTokenPayload.role,
    userType: refreshTokenPayload.userType
  };

  const token = jwt.sign(accessTokenPayload, this.ACCESS_TOKEN_SECRET, {
    expiresIn: this.ACCESS_TOKEN_EXPIRY
  });
  
  console.log('JWTService - New access token generated');
  return token;
  }
}