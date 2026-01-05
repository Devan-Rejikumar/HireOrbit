import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IStripeService } from '../services/interfaces/IStripeService';
import { ISubscriptionService } from '../services/interfaces/ISubscriptionService';
import { ISubscriptionRepository } from '../repositories/interfaces/ISubscriptionRepository';
import { ISubscriptionPlanRepository } from '../repositories/interfaces/ISubscriptionPlanRepository';
import { ITransactionRepository } from '../repositories/interfaces/ITransactionRepository';
import { asyncHandler } from '../utils/asyncHandler';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import Stripe from 'stripe';
import { SubscriptionStatus } from '../enums/StatusCodes';

@injectable()
export class StripeWebhookHandler {
  constructor(
    @inject(TYPES.IStripeService)
    private readonly _stripeService: IStripeService,
    @inject(TYPES.ISubscriptionService)
    private readonly _subscriptionService: ISubscriptionService,
    @inject(TYPES.ISubscriptionRepository)
    private readonly _subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.ISubscriptionPlanRepository)
    private readonly _subscriptionPlanRepository: ISubscriptionPlanRepository,
    @inject(TYPES.ITransactionRepository)
    private readonly _transactionRepository: ITransactionRepository,
  ) {}

  handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = this._stripeService.constructWebhookEvent(req.body, signature);
    } catch (error) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'Invalid signature' });
      return;
    }

    try {
      switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice_payment.paid':  
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log('Unhandled webhook event type', { type: event.type });
      }

      res.status(HttpStatusCode.OK).json(buildSuccessResponse({ received: true }, 'Webhook processed'));
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Webhook processing failed' });
    }
  });

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const existingSubscription = await this._subscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (existingSubscription) {
      const updateData: {
        status: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
      } = {
        status: this.mapStripeStatus(subscription.status),
      };

      const currentPeriodStart = (subscription as unknown as { current_period_start?: number }).current_period_start;
      const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

      if (currentPeriodStart) {
        updateData.currentPeriodStart = new Date(currentPeriodStart * 1000);
      }
      if (currentPeriodEnd) {
        updateData.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
      }

      await this._subscriptionService.updateSubscriptionFromWebhook(subscription.id, updateData);
    } else {

      let subscriptionToUse = subscription;
      if (!subscription.metadata || !subscription.metadata.planId) {
        console.log('Metadata missing from subscription, retrieving from Stripe', {
          subscriptionId: subscription.id,
        });
        try {
          subscriptionToUse = await this._stripeService.getSubscription(subscription.id);
        } catch (error) {
          console.error('Failed to retrieve subscription from Stripe', {
            error,
            subscriptionId: subscription.id,
          });
        }
      }
      await this.createSubscriptionFromStripe(subscriptionToUse);
    }
  }

  private async createSubscriptionFromStripe(stripeSubscription: Stripe.Subscription): Promise<void> {
    try {

      let metadata = stripeSubscription.metadata || {};
  
      if ((!metadata.planId || (!metadata.userId && !metadata.companyId)) && stripeSubscription.customer) {
        const customerId = typeof stripeSubscription.customer === 'string' 
          ? stripeSubscription.customer 
          : stripeSubscription.customer.id;
        
        try {
   
          const customer = await this._stripeService.getCustomer(customerId);
          if (customer && customer.metadata) {
            metadata = {
              ...metadata,
              ...customer.metadata,
            };
            console.log('Retrieved metadata from customer', { 
              customerId, 
              customerMetadata: JSON.stringify(customer.metadata), 
            });
          }
        } catch (error: unknown) {
          const err = error as { message?: string };
          console.warn('Failed to retrieve customer for metadata', { 
            error: err.message, 
            customerId, 
          });
        }
      }
      
      let userId = metadata.userId && metadata.userId !== '' ? metadata.userId : undefined;
      let companyId = metadata.companyId && metadata.companyId !== '' ? metadata.companyId : undefined;
      let planId = metadata.planId && metadata.planId !== '' ? metadata.planId : undefined;
      
      if (!planId) {
        const subscriptionItem = stripeSubscription.items.data[0];
        const priceId = subscriptionItem?.price?.id;
        
        if (priceId) {
       
          const allPlans = await this._subscriptionPlanRepository.findAll();
          const matchingPlan = allPlans.find(
            plan => plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId,
          );
          
          if (matchingPlan) {
            planId = matchingPlan.id;
          } else {
            console.error('Plan not found by Stripe price ID', { priceId });
          }
        }
      }

      if (!planId) {
        console.error('Plan ID not found - cannot create subscription', { 
          subscriptionId: stripeSubscription.id,
          subscriptionMetadata: JSON.stringify(stripeSubscription.metadata || {}),
          priceId: stripeSubscription.items.data[0]?.price?.id,
        });
        return;
      }

      if (!userId && !companyId) {
        console.error('Neither userId nor companyId found in subscription metadata', {
          subscriptionId: stripeSubscription.id,
          metadata: JSON.stringify(metadata),
        });
        return;
      }
      
      const plan = await this._subscriptionPlanRepository.findById(planId);
      if (!plan) {
        console.error('Plan not found', { planId, subscriptionId: stripeSubscription.id });
        return;
      }

      const subscriptionItem = stripeSubscription.items.data[0];
      const price = subscriptionItem?.price;
      const billingPeriod = price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      const customerId = typeof stripeSubscription.customer === 'string' 
        ? stripeSubscription.customer 
        : stripeSubscription.customer.id;
      const subData = stripeSubscription as unknown as {
        current_period_start?: number;
        current_period_end?: number;
      };

      const currentPeriodStart = subData.current_period_start 
        ? new Date(subData.current_period_start * 1000)
        : new Date();
      const currentPeriodEnd = subData.current_period_end 
        ? new Date(subData.current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 

      console.log('Attempting to create subscription record', {
        subscriptionId: stripeSubscription.id,
        userId,
        companyId,
        planId,
        customerId,
        billingPeriod,
        status: this.mapStripeStatus(stripeSubscription.status),
      });
      const subscription = await this._subscriptionRepository.create({
        userId,
        companyId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customerId,
        status: this.mapStripeStatus(stripeSubscription.status),
        billingPeriod,
        currentPeriodStart,
        currentPeriodEnd,
      });

      console.log('Subscription created from Stripe webhook', {
        subscriptionId: subscription.id,
        stripeSubscriptionId: stripeSubscription.id,
        userId,
        companyId,
        planId,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      console.error('Failed to create subscription from Stripe webhook', {
        error: err.message || error,
        stack: err.stack,
        subscriptionId: stripeSubscription.id,
        metadata: JSON.stringify(stripeSubscription.metadata || {}),
      });
      throw error;
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription updated in Stripe', { subscriptionId: subscription.id });
    
    const updateData: {
      status: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
    } = {
      status: this.mapStripeStatus(subscription.status),
    };

    const subData = subscription as unknown as {
      current_period_start?: number;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
    };

    if (subData.current_period_start) {
      updateData.currentPeriodStart = new Date(subData.current_period_start * 1000);
    }
    if (subData.current_period_end) {
      updateData.currentPeriodEnd = new Date(subData.current_period_end * 1000);
    }
    if (subData.cancel_at_period_end !== undefined) {
      updateData.cancelAtPeriodEnd = subData.cancel_at_period_end;
    }
    
    await this._subscriptionService.updateSubscriptionFromWebhook(subscription.id, updateData);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription deleted in Stripe', { subscriptionId: subscription.id });
    
    await this._subscriptionService.updateSubscriptionFromWebhook(subscription.id, {
      status: SubscriptionStatus.CANCELLED,
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('=== PAYMENT SUCCEEDED WEBHOOK ===');
    console.log('Invoice ID:', invoice.id);
    console.log('Invoice amount:', invoice.amount_paid);
    console.log('Invoice currency:', invoice.currency);
    
    const invoiceData = invoice as unknown as { subscription?: string | Stripe.Subscription | null };
    const subscription = invoiceData.subscription;
    
    if (subscription) {
      const subscriptionId = typeof subscription === 'string' 
        ? subscription 
        : subscription.id;
      
      console.log('Updating subscription status to ACTIVE', { subscriptionId });
      await this._subscriptionService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.ACTIVE,
      });
    }

    console.log('Creating transaction from invoice...');
    await this.createTransactionFromInvoice(invoice, 'succeeded');
    console.log('=== PAYMENT SUCCEEDED WEBHOOK COMPLETED ===');
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.warn('Payment failed', { invoiceId: invoice.id });
    
    const invoiceData = invoice as unknown as { subscription?: string | Stripe.Subscription | null };
    const subscription = invoiceData.subscription;
    
    if (subscription) {
      const subscriptionId = typeof subscription === 'string' 
        ? subscription 
        : subscription.id;
      
      await this._subscriptionService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.PAST_DUE,
      });
    }
    await this.createTransactionFromInvoice(invoice, 'failed');
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Checkout session completed', { 
      sessionId: session.id,
      sessionMetadata: JSON.stringify(session.metadata || {}),
    });
 
    if (session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id;

      const subscription = await this._subscriptionService.getSubscriptionByStripeId(subscriptionId);
      if (subscription) {
        await this._subscriptionService.updateSubscriptionFromWebhook(subscriptionId, {
          status: SubscriptionStatus.ACTIVE,
        });
      } else {
        console.log('Subscription not found in database, retrieving from Stripe', { 
          stripeSubscriptionId: subscriptionId,
          sessionId: session.id,
          sessionMetadata: JSON.stringify(session.metadata || {}),
        });
        
        try {
          const stripeSubscription = await this._stripeService.getSubscription(subscriptionId);
          if ((!stripeSubscription.metadata || !stripeSubscription.metadata.planId) && session.metadata) {
            console.log('Using session metadata as fallback', {
              subscriptionId,
              sessionMetadata: JSON.stringify(session.metadata),
            });

            stripeSubscription.metadata = {
              ...(stripeSubscription.metadata || {}),
              ...session.metadata,
            };
          }
          
          await this.createSubscriptionFromStripe(stripeSubscription);
        } catch (error: unknown) {
          const err = error as { message?: string; stack?: string };
          console.error('Failed to retrieve and create subscription from Stripe', {
            error: err.message || error,
            stack: err.stack,
            subscriptionId,
          });
        }
      }
    }
  }

  private async createTransactionFromInvoice(invoice: Stripe.Invoice, status: 'succeeded' | 'failed'): Promise<void> {

    const invoiceData = invoice as unknown as { 
      subscription?: string | Stripe.Subscription | null;
      payment_intent?: string | Stripe.PaymentIntent | null;
      amount_paid?: number;
      currency?: string;
      lines?: {
        data?: Array<{
          price?: {
            id?: string;
            recurring?: {
              interval?: string;
            };
          };
        }>;
      };
    };

    const subscriptionId = invoiceData.subscription
      ? (typeof invoiceData.subscription === 'string' ? invoiceData.subscription : invoiceData.subscription.id)
      : null;

    let planId: string | undefined;

    try {
 
      if (invoice.id) {
        const existingTransaction = await this._transactionRepository.findByStripeInvoiceId(invoice.id);
        if (existingTransaction) {
          console.log('Transaction already exists for invoice', { 
            invoiceId: invoice.id,
            transactionId: existingTransaction.id, 
          });
          return;
        }
      }

      let subscription = null;
      let userId: string | undefined;
      let companyId: string | undefined;
      let billingPeriod: string = 'monthly';

      if (subscriptionId) {
        subscription = await this._subscriptionRepository.findByStripeSubscriptionId(subscriptionId);
        if (subscription) {
          userId = subscription.userId || undefined;
          companyId = subscription.companyId || undefined;
         
          billingPeriod = subscription.billingPeriod;
        }
      }
      if (invoiceData.lines?.data?.[0]?.price?.id) {
        const priceId = invoiceData.lines.data[0].price.id;
        const allPlans = await this._subscriptionPlanRepository.findAll();
        const matchingPlan = allPlans.find(
          plan => plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId,
        );
        if (matchingPlan) {
          planId = matchingPlan.id;
          billingPeriod = matchingPlan.stripePriceIdMonthly === priceId ? 'monthly' : 'yearly';
        }
      }

      if (!planId && subscription) {
        planId = subscription.planId;
      }

      if (!planId) {
        console.error(' Cannot create transaction: plan not found', { 
          invoiceId: invoice.id,
          subscriptionId,
          priceId: invoiceData.lines?.data?.[0]?.price?.id,
          amount: invoiceData.amount_paid ? invoiceData.amount_paid / 100 : 0,
          hasSubscription: !!subscription,
        });
        return;
      }

      const amountPaid = invoiceData.amount_paid || 0;
      const amount = invoiceData.currency?.toLowerCase() === 'inr' 
        ? amountPaid / 100  
        : amountPaid / 100; 

      const paymentIntentId = invoiceData.payment_intent
        ? (typeof invoiceData.payment_intent === 'string' ? invoiceData.payment_intent : invoiceData.payment_intent.id)
        : undefined;

      const invoiceObj = invoice as unknown as { created?: number; status_transitions?: { paid_at?: number } };
      const paymentDate = invoiceObj.status_transitions?.paid_at
        ? new Date(invoiceObj.status_transitions.paid_at * 1000)
        : (invoiceObj.created ? new Date(invoiceObj.created * 1000) : new Date());

      console.log('Transaction data prepared:', {
        subscriptionId: subscription?.id,
        userId,
        companyId,
        planId,
        amount,
        currency: invoiceData.currency?.toLowerCase() || 'inr',
        status,
        stripeInvoiceId: invoice.id,
        billingPeriod,
        paymentDate,
      });

      const transaction = await this._transactionRepository.create({
        subscriptionId: subscription?.id,
        userId,
        companyId,
        planId,
        amount,
        currency: invoiceData.currency?.toLowerCase() || 'inr',
        status,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: paymentIntentId,
        billingPeriod,
        paymentDate,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      const errorAmount = invoiceData.amount_paid ? invoiceData.amount_paid / 100 : 0;
      
      console.error(' Failed to create transaction from invoice', {
        error: err.message || error,
        stack: err.stack,
        invoiceId: invoice.id,
        amount: errorAmount,
        subscriptionId: subscriptionId || 'unknown',
        planId: planId || 'unknown',
      });
     
    }
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
    const statusMap: Record<Stripe.Subscription.Status, string> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELLED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.CANCELLED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
      unpaid: SubscriptionStatus.PAST_DUE,
      paused: SubscriptionStatus.CANCELLED,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.CANCELLED;
  }
}

