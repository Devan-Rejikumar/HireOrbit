/**
 * Express namespace type declarations
 * Centralized Express Request type extensions
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        userType: string;
      };
    }
  }
}

export {};

