import Stripe from 'stripe';
import { AppConfig } from './app.config';

if (!AppConfig.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is required. Please add it to your .env file.',
  );
}

export const stripe = new Stripe(AppConfig.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});