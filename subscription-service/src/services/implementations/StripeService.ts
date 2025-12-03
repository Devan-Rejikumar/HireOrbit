import { injectable } from 'inversify';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe.config';
import { AppConfig } from '../../config/app.config';
import { IStripeService } from '../interfaces/IStripeService';
// Logger removed - using console.log instead

@injectable()
export class StripeService implements IStripeService {
  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });
      console.log('Stripe customer created', { customerId: customer.id, email });
      return customer;
    } catch (error) {
      console.error('Failed to create Stripe customer', { error, email });
      throw error;
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        expand: ['latest_invoice.payment_intent'],
      });
      console.log('Stripe subscription created', { subscriptionId: subscription.id, customerId });
      return subscription;
    } catch (error) {
      console.error('Failed to create Stripe subscription', { error, customerId, priceId });
      throw error;
    }
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
          metadata,
        },
      });
      console.log('Stripe checkout session created', { sessionId: session.id, customerId });
      return session;
    } catch (error) {
      console.error('Failed to create Stripe checkout session', { error, customerId, priceId });
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      console.log('Stripe subscription cancelled', { subscriptionId });
      return subscription;
    } catch (error) {
      console.error('Failed to cancel Stripe subscription', { error, subscriptionId });
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice',
      });
      console.log('Stripe subscription updated', { subscriptionId, newPriceId });
      return updatedSubscription;
    } catch (error) {
      console.error('Failed to update Stripe subscription', { error, subscriptionId, newPriceId });
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'items.data.price'],
      });
      return subscription;
    } catch (error) {
      console.error('Failed to retrieve Stripe subscription', { error, subscriptionId });
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Failed to retrieve Stripe customer', { error, customerId });
      throw error;
    }
  }

  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        AppConfig.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook verification failed', { error });
      throw error;
    }
  }
}

