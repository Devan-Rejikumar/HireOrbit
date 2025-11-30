/**
 * Time-related constants used across the company service
 */

import { AppConfig } from '../config/app.config';

export const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || '300');
export const PASSWORD_RESET_OTP_EXPIRY_SECONDS = parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_SECONDS || '900');
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_EXPIRY_SECONDS = 604800;
export const SESSION_EXPIRY_SECONDS = 86400;
export const OTP_MIN_VALUE = AppConfig.OTP_MIN_VALUE;
export const OTP_MAX_VALUE = AppConfig.OTP_MAX_VALUE;
