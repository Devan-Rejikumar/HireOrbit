import { injectable } from 'inversify';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe.config';
import { AppConfig } from '../../config/app.config';
import { IStripeService } from '../interfaces/IStripeService';

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
    metadata?: Record<string, string>,
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
    metadata?: Record<string, string>,
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
        AppConfig.STRIPE_WEBHOOK_SECRET,
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook verification failed', { error });
      throw error;
    }
  }

  async createProduct(name: string, description?: string, metadata?: Record<string, string>): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.create({
        name,
        description,
        metadata,
      });
      console.log('Stripe product created', { productId: product.id, name });
      return product;
    } catch (error) {
      console.error('Failed to create Stripe product', { error, name });
      throw error;
    }
  }

  async createPrice(
    productId: string,
    amount: number,
    currency: string = 'usd',
    interval: 'month' | 'year' = 'month',
    metadata?: Record<string, string>,
  ): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100), 
        currency,
        recurring: {
          interval,
        },
        metadata,
      });
      console.log('Stripe price created', { priceId: price.id, productId, amount, interval });
      return price;
    } catch (error) {
      console.error('Failed to create Stripe price', { error, productId, amount, interval });
      throw error;
    }
  }

  async updatePrice(priceId: string, metadata?: Record<string, string>, active?: boolean): Promise<Stripe.Price> {
    try {
      const updateData: Stripe.PriceUpdateParams = {};
      if (metadata !== undefined) updateData.metadata = metadata;
      if (active !== undefined) updateData.active = active;
      
      const price = await stripe.prices.update(priceId, updateData);
      console.log('Stripe price updated', { priceId });
      return price;
    } catch (error) {
      console.error('Failed to update Stripe price', { error, priceId });
      throw error;
    }
  }

  async getPrice(priceId: string): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log('Stripe price retrieved', { priceId, productId: price.product });
      return price;
    } catch (error) {
      console.error('Failed to retrieve Stripe price', { error, priceId });
      throw error;
    }
  }

  async archiveProduct(productId: string): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.update(productId, { active: false });
      console.log('Stripe product archived', { productId });
      return product;
    } catch (error) {
      console.error('Failed to archive Stripe product', { error, productId });
      throw error;
    }
  }

  async listInvoices(limit: number = 100, startingAfter?: string): Promise<Stripe.ApiList<Stripe.Invoice>> {
    try {
      const params: Stripe.InvoiceListParams = {
        limit,
        expand: ['data.subscription', 'data.payment_intent', 'data.lines.data.price'],
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      const invoices = await stripe.invoices.list(params);
      return invoices;
    } catch (error) {
      console.error('Failed to list Stripe invoices', { error });
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['subscription', 'payment_intent', 'lines.data.price'],
      });
      return invoice;
    } catch (error) {
      console.error('Failed to retrieve Stripe invoice', { error, invoiceId });
      throw error;
    }
  }
}

