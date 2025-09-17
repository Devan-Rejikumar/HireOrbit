// src/config/environment.ts
export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  jwtSecret: string;
  refreshTokenSecret: string;
}

const config: EnvironmentConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refresh_secret',
};

export default config;