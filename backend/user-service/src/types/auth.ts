export interface TokenPair{
    accessToken: string;
    refreshToken: string;
}
export interface RefreshTokenPayload {
    userId : string;
    email: string;
    role: string;
    userType : string;
    tokenId : string;
}
export interface AccessTokenPayload {
    userId: string;
    email: string;
    role: string;
    userType: string;
}

export interface AdminTokenPayload {
  userId: string;
  email: string;
  role: string;
  userType: string;
  iat?: number;
  exp?: number;
}