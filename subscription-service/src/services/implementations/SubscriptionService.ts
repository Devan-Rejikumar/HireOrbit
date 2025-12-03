import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { ISubscriptionService, CreateSubscriptionInput } from '../interfaces/ISubscriptionService';
import { SubscriptionStatusResponse } from '../../dto/responses/subscription.response';
import { IStripeService } from '../interfaces/IStripeService';
import { ISubscriptionRepository } from '../../repositories/interfaces/ISubscriptionRepository';
import { ISubscriptionPlanRepository } from '../../repositories/interfaces/ISubscriptionPlanRepository';
import { Subscription, SubscriptionPlan } from '@prisma/client';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { Messages } from '../../constants/Messages';
// Logger removed - using console.log instead
import { SubscriptionStatus } from '../../enums/StatusCodes';
import { mapSubscriptionStatusToResponse } from '../../dto/mappers/subscription.mapper';
import { AppConfig } from '../../config/app.config';

@injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @inject(TYPES.IStripeService)
    private readonly _stripeService: IStripeService,
    @inject(TYPES.ISubscriptionRepository)
    private readonly _subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.ISubscriptionPlanRepository)
    private readonly _subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {}

  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    try {
      // Validate plan exists
      const plan = await this._subscriptionPlanRepository.findById(input.planId);
      if (!plan) {
        throw new AppError(Messages.SUBSCRIPTION.INVALID_PLAN, HttpStatusCode.BAD_REQUEST);
      }

      // Check if user/company already has an active subscription
      const existingSubscription = input.userId
        ? await this._subscriptionRepository.findByUserId(input.userId)
        : await this._subscriptionRepository.findByCompanyId(input.companyId!);

      if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
        throw new AppError(Messages.SUBSCRIPTION.ALREADY_EXISTS, HttpStatusCode.CONFLICT);
      }

      // Handle Free plans - no Stripe needed
      const isFreePlan = plan.priceMonthly === null || plan.priceMonthly === 0;
      
      if (isFreePlan) {
        // For free plans, create subscription directly without Stripe
        const subscription = await this._subscriptionRepository.create({
          userId: input.userId,
          companyId: input.companyId,
          planId: input.planId,
          stripeSubscriptionId: `free_${Date.now()}`, // Dummy ID for free plans
          stripeCustomerId: `free_customer_${input.userId || input.companyId}`, // Dummy customer ID
          status: SubscriptionStatus.ACTIVE,
          billingPeriod: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        });

        console.log('Free subscription created', {
          subscriptionId: subscription.id,
          userId: input.userId,
          companyId: input.companyId,
          planId: input.planId,
        });

        return subscription;
      }

      // Get Stripe price ID based on billing period
      const stripePriceId = input.billingPeriod === 'monthly'
        ? plan.stripePriceIdMonthly
        : plan.stripePriceIdYearly;

      if (!stripePriceId) {
        throw new AppError('Stripe price ID not configured for this plan', HttpStatusCode.BAD_REQUEST);
      }

      // Create or get Stripe customer
      // TODO: Fetch actual email from user-service/company-service
      const customerEmail = input.userId ? `user-${input.userId}@example.com` : `company-${input.companyId}@example.com`;
      const customerName = input.userId ? `User ${input.userId}` : `Company ${input.companyId}`;
      
      const customer = await this._stripeService.createCustomer(customerEmail, customerName, {
        userId: input.userId || '',
        companyId: input.companyId || '',
      });

      // Create Stripe subscription
      const stripeSubscription = await this._stripeService.createSubscription(
        customer.id,
        stripePriceId,
        {
          userId: input.userId || '',
          companyId: input.companyId || '',
          planId: input.planId,
        }
      );

      // Create subscription record in database
      const subData = stripeSubscription as unknown as {
        current_period_start?: number;
        current_period_end?: number;
      };
      
      const subscription = await this._subscriptionRepository.create({
        userId: input.userId,
        companyId: input.companyId,
        planId: input.planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customer.id,
        status: stripeSubscription.status,
        billingPeriod: input.billingPeriod,
        currentPeriodStart: new Date((subData.current_period_start || 0) * 1000),
        currentPeriodEnd: new Date((subData.current_period_end || 0) * 1000),
      });

      console.log('Subscription created', {
        subscriptionId: subscription.id,
        userId: input.userId,
        companyId: input.companyId,
        planId: input.planId,
      });

      return subscription;
    } catch (error) {
      console.error('Failed to create subscription', { error, input });
      if (error instanceof AppError) {
        throw error;
      }
      // FIX: Use proper error message instead of success message
      throw new AppError(
        'Failed to create subscription. Please try again later.',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createCheckoutSession(input: CreateSubscriptionInput): Promise<{ url: string; sessionId: string }> {
    try {
      // Validate plan exists
      const plan = await this._subscriptionPlanRepository.findById(input.planId);
      if (!plan) {
        throw new AppError(Messages.SUBSCRIPTION.INVALID_PLAN, HttpStatusCode.BAD_REQUEST);
      }

      // Get Stripe price ID based on billing period
      const stripePriceId = input.billingPeriod === 'monthly'
        ? plan.stripePriceIdMonthly
        : plan.stripePriceIdYearly;

      if (!stripePriceId) {
        throw new AppError('Stripe price ID not configured for this plan', HttpStatusCode.BAD_REQUEST);
      }

      // Create or get Stripe customer
      const customerEmail = input.userId ? `user-${input.userId}@example.com` : `company-${input.companyId}@example.com`;
      const customerName = input.userId ? `User ${input.userId}` : `Company ${input.companyId}`;
      
      const customer = await this._stripeService.createCustomer(customerEmail, customerName, {
        userId: input.userId || '',
        companyId: input.companyId || '',
      });

      // Create checkout session
      const frontendUrl = AppConfig.FRONTEND_URL || 'http://localhost:5173';
      const successUrl = `${frontendUrl}/subscriptions/status?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${frontendUrl}/subscriptions?canceled=true`;

      const session = await this._stripeService.createCheckoutSession(
        customer.id,
        stripePriceId,
        successUrl,
        cancelUrl,
        {
          userId: input.userId || '',
          companyId: input.companyId || '',
          planId: input.planId,
        }
      );

      console.log('Checkout session created', {
        sessionId: session.id,
        userId: input.userId,
        companyId: input.companyId,
        planId: input.planId,
      });

      return {
        url: session.url || '',
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Failed to create checkout session', { error, input });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to create checkout session. Please try again later.',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const subscription = await this._subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new AppError(Messages.SUBSCRIPTION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      // Cancel in Stripe
      await this._stripeService.cancelSubscription(subscription.stripeSubscriptionId);

      // Update in database
      await this._subscriptionRepository.update(subscriptionId, {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
      });

      console.log('Subscription cancelled', { subscriptionId });
    } catch (error) {
      console.error('Failed to cancel subscription', { error, subscriptionId });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to cancel subscription', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    try {
      const subscription = await this._subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new AppError(Messages.SUBSCRIPTION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      const newPlan = await this._subscriptionPlanRepository.findById(newPlanId);
      if (!newPlan) {
        throw new AppError(Messages.SUBSCRIPTION.INVALID_PLAN, HttpStatusCode.BAD_REQUEST);
      }

      // Get appropriate Stripe price ID
      const newStripePriceId = subscription.billingPeriod === 'monthly'
        ? newPlan.stripePriceIdMonthly
        : newPlan.stripePriceIdYearly;

      if (!newStripePriceId) {
        throw new AppError('Stripe price ID not configured for this plan', HttpStatusCode.BAD_REQUEST);
      }

      // Update in Stripe
      const updatedStripeSubscription = await this._stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        newStripePriceId
      );

      // Update in database
      const subData = updatedStripeSubscription as unknown as {
        current_period_start?: number;
        current_period_end?: number;
      };
      
      const updatedSubscription = await this._subscriptionRepository.update(subscriptionId, {
        planId: newPlanId,
        currentPeriodStart: new Date((subData.current_period_start || 0) * 1000),
        currentPeriodEnd: new Date((subData.current_period_end || 0) * 1000),
      });

      console.log('Subscription upgraded', { subscriptionId, newPlanId });
      return updatedSubscription;
    } catch (error) {
      console.error('Failed to upgrade subscription', { error, subscriptionId, newPlanId });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to upgrade subscription', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async downgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    // Same logic as upgrade, but you might want to handle proration differently
    return this.upgradeSubscription(subscriptionId, newPlanId);
  }

  async getSubscriptionStatus(userId?: string, companyId?: string): Promise<SubscriptionStatusResponse> {
    try {
      if (!userId && !companyId) {
        throw new AppError('Either userId or companyId must be provided', HttpStatusCode.BAD_REQUEST);
      }

      const subscription = userId
        ? await this._subscriptionRepository.findByUserId(userId)
        : await this._subscriptionRepository.findByCompanyId(companyId!);

      if (!subscription) {
        return {
          subscription: null,
          plan: null,
          features: [],
          isActive: false,
        };
      }

      const subscriptionWithPlan = subscription as unknown as {
        plan?: SubscriptionPlan & {
          features?: Array<{ name: string }>;
        } | null;
      };
      
      const plan = subscriptionWithPlan.plan;
      const features = plan?.features?.map((f: { name: string }) => f.name) || [];
      
      // Check if subscription is active or trialing
      const isStatusActive = subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIALING;
      
      // Check if subscription is cancelled but still within paid period
      // Users should have access until the end of the period they paid for
      const isCancelledButActive = 
        subscription.status === SubscriptionStatus.CANCELLED &&
        subscription.cancelAtPeriodEnd === true &&
        subscription.currentPeriodEnd > new Date();
      
      const isActive = isStatusActive || isCancelledButActive;

      return mapSubscriptionStatusToResponse(
        subscription,
        plan || null,
        features,
        isActive
      );
    } catch (error) {
      console.error('Failed to get subscription status', { error, userId, companyId });
      throw error;
    }
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this._subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
  }

  async updateSubscriptionFromWebhook(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription> {
    return this._subscriptionRepository.updateByStripeSubscriptionId(stripeSubscriptionId, data);
  }

  async getAllPlans(userType: 'user' | 'company'): Promise<SubscriptionPlan[]> {
    return this._subscriptionPlanRepository.findAllByUserType(userType);
  }
}

