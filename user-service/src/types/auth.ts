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