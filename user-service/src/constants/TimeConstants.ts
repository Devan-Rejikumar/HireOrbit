/**
 * Time-related constants used across the user service
 */

import { AppConfig } from "../config/app.config";

export const OTP_EXPIRY_SECONDS = 300;
export const PASSWORD_RESET_OTP_EXPIRY_SECONDS = 900; 
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const GOOGLE_AUTH_TOKEN_EXPIRY = '24h';
export const REFRESH_TOKEN_EXPIRY_SECONDS = 604800;
export const REDIS_KEEP_ALIVE_MS = 30000;
export const OTP_MIN_VALUE = AppConfig.OTP_MIN_VALUE;
export const OTP_MAX_VALUE = AppConfig.OTP_MAX_VALUE;
export const SESSION_EXPIRY_SECONDS = 86400; 


