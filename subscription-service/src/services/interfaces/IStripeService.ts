import Stripe from 'stripe';

export interface IStripeService {
  createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<Stripe.Customer>;
  createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription>;
  createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session>;
  cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
  updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription>;
  getSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
  getCustomer(customerId: string): Promise<Stripe.Customer>;
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event;
}

