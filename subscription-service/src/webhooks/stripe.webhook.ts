import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IStripeService } from '../services/interfaces/IStripeService';
import { ISubscriptionService } from '../services/interfaces/ISubscriptionService';
import { ISubscriptionRepository } from '../repositories/interfaces/ISubscriptionRepository';
import { ISubscriptionPlanRepository } from '../repositories/interfaces/ISubscriptionPlanRepository';
import { asyncHandler } from '../utils/asyncHandler';
import { buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
// Logger removed - using console.log instead
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
  ) {}

  handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log('=== WEBHOOK REQUEST RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('Body length:', req.body?.length || 0);
    
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      console.error('Missing stripe-signature header');
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'Missing stripe-signature header' });
      return;
    }
    
    console.log('Stripe signature found:', signature.substring(0, 20) + '...');

    let event: Stripe.Event;

    try {
      event = this._stripeService.constructWebhookEvent(req.body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed', error);
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'Invalid signature' });
      return;
    }

    console.log('Stripe webhook received', { type: event.type, id: event.id });

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
      console.error('Error processing webhook', { error, eventType: event.type });
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Webhook processing failed' });
    }
  });

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription created in Stripe', { subscriptionId: subscription.id });
    
    // Check if subscription already exists in our database
    const existingSubscription = await this._subscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (existingSubscription) {
      // Update existing subscription
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
      // Create new subscription record from Stripe subscription (for Checkout Session flow)
      // If metadata is missing, retrieve the subscription with expanded data
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
      // Extract metadata from subscription
      let metadata = stripeSubscription.metadata || {};
      
      // If metadata is missing, try to get it from customer
      if ((!metadata.planId || (!metadata.userId && !metadata.companyId)) && stripeSubscription.customer) {
        const customerId = typeof stripeSubscription.customer === 'string' 
          ? stripeSubscription.customer 
          : stripeSubscription.customer.id;
        
        try {
          // Retrieve customer to get metadata
          const customer = await this._stripeService.getCustomer(customerId);
          if (customer && customer.metadata) {
            metadata = {
              ...metadata,
              ...customer.metadata,
            };
            console.log('Retrieved metadata from customer', { 
              customerId, 
              customerMetadata: JSON.stringify(customer.metadata) 
            });
          }
        } catch (error: any) {
          console.warn('Failed to retrieve customer for metadata', { 
            error: error?.message, 
            customerId 
          });
        }
      }
      
      let userId = metadata.userId && metadata.userId !== '' ? metadata.userId : undefined;
      let companyId = metadata.companyId && metadata.companyId !== '' ? metadata.companyId : undefined;
      let planId = metadata.planId && metadata.planId !== '' ? metadata.planId : undefined;

      console.log('Creating subscription from Stripe webhook', {
        subscriptionId: stripeSubscription.id,
        metadata,
        userId,
        companyId,
        planId,
      });

      // If planId is still missing, try to find it by Stripe price ID
      if (!planId) {
        const subscriptionItem = stripeSubscription.items.data[0];
        const priceId = subscriptionItem?.price?.id;
        
        if (priceId) {
          console.log('Plan ID missing, attempting to find by Stripe price ID', { priceId });
          // Find all plans and match by price ID
          const allPlans = await this._subscriptionPlanRepository.findAll();
          const matchingPlan = allPlans.find(
            plan => plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId
          );
          
          if (matchingPlan) {
            planId = matchingPlan.id;
            console.log('Found plan by Stripe price ID', { planId, priceId, planName: matchingPlan.name });
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

      // Verify plan exists
      const plan = await this._subscriptionPlanRepository.findById(planId);
      if (!plan) {
        console.error('Plan not found', { planId, subscriptionId: stripeSubscription.id });
        return;
      }

      // Determine billing period from subscription interval
      const subscriptionItem = stripeSubscription.items.data[0];
      const price = subscriptionItem?.price;
      const billingPeriod = price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

      // Get customer ID
      const customerId = typeof stripeSubscription.customer === 'string' 
        ? stripeSubscription.customer 
        : stripeSubscription.customer.id;

      // Get period dates
      const subData = stripeSubscription as unknown as {
        current_period_start?: number;
        current_period_end?: number;
      };

      const currentPeriodStart = subData.current_period_start 
        ? new Date(subData.current_period_start * 1000)
        : new Date();
      const currentPeriodEnd = subData.current_period_end 
        ? new Date(subData.current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days

      console.log('Attempting to create subscription record', {
        subscriptionId: stripeSubscription.id,
        userId,
        companyId,
        planId,
        customerId,
        billingPeriod,
        status: this.mapStripeStatus(stripeSubscription.status),
      });

      // Create subscription record
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
    } catch (error: any) {
      console.error('Failed to create subscription from Stripe webhook', {
        error: error?.message || error,
        stack: error?.stack,
        subscriptionId: stripeSubscription.id,
        metadata: JSON.stringify(stripeSubscription.metadata || {}),
      });
      // Re-throw to allow caller to handle if needed
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
    console.log('Payment succeeded', { invoiceId: invoice.id });
    
    const invoiceData = invoice as unknown as { subscription?: string | Stripe.Subscription | null };
    const subscription = invoiceData.subscription;
    
    if (subscription) {
      const subscriptionId = typeof subscription === 'string' 
        ? subscription 
        : subscription.id;
      
      await this._subscriptionService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.ACTIVE,
      });
    }
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
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Checkout session completed', { 
      sessionId: session.id,
      sessionMetadata: JSON.stringify(session.metadata || {}),
    });
    
    // The subscription should already be created by Stripe
    // We just need to ensure our database is in sync
    if (session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id;
      
      // Verify subscription exists and is active
      const subscription = await this._subscriptionService.getSubscriptionByStripeId(subscriptionId);
      if (subscription) {
        await this._subscriptionService.updateSubscriptionFromWebhook(subscriptionId, {
          status: SubscriptionStatus.ACTIVE,
        });
      } else {
        // If subscription doesn't exist, retrieve it from Stripe and create it
        console.log('Subscription not found in database, retrieving from Stripe', { 
          stripeSubscriptionId: subscriptionId,
          sessionId: session.id,
          sessionMetadata: JSON.stringify(session.metadata || {}),
        });
        
        try {
          // Retrieve subscription with expanded data to get metadata
          const stripeSubscription = await this._stripeService.getSubscription(subscriptionId);
          
          // If subscription metadata is missing, try to use session metadata as fallback
          if ((!stripeSubscription.metadata || !stripeSubscription.metadata.planId) && session.metadata) {
            console.log('Using session metadata as fallback', {
              subscriptionId,
              sessionMetadata: JSON.stringify(session.metadata),
            });
            // Merge session metadata into subscription metadata
            stripeSubscription.metadata = {
              ...(stripeSubscription.metadata || {}),
              ...session.metadata,
            };
          }
          
          await this.createSubscriptionFromStripe(stripeSubscription);
        } catch (error: any) {
          console.error('Failed to retrieve and create subscription from Stripe', {
            error: error?.message || error,
            stack: error?.stack,
            subscriptionId,
          });
        }
      }
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

