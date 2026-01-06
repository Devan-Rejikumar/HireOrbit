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
      const plan = await this._subscriptionPlanRepository.findById(input.planId);
      if (!plan) {
        throw new AppError(Messages.SUBSCRIPTION.INVALID_PLAN, HttpStatusCode.BAD_REQUEST);
      }

      const existingSubscription = input.userId
        ? await this._subscriptionRepository.findByUserId(input.userId)
        : await this._subscriptionRepository.findByCompanyId(input.companyId!);

      if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
        throw new AppError(Messages.SUBSCRIPTION.ALREADY_EXISTS, HttpStatusCode.CONFLICT);
      }

      const isFreePlan = plan.priceMonthly === null || plan.priceMonthly === 0;
      
      if (isFreePlan) {
        // For free plans, update existing subscription if it exists (cancelled/expired), otherwise create new
        if (existingSubscription) {
          const updatedSubscription = await this._subscriptionRepository.update(existingSubscription.id, {
            planId: input.planId,
            stripeSubscriptionId: `free_${Date.now()}`,
            stripeCustomerId: `free_customer_${input.userId || input.companyId}`,
            status: SubscriptionStatus.ACTIVE,
            billingPeriod: 'monthly',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
          });

          console.log('Free subscription reactivated', {
            subscriptionId: updatedSubscription.id,
            userId: input.userId,
            companyId: input.companyId,
            planId: input.planId,
          });

          return updatedSubscription;
        }

        const subscription = await this._subscriptionRepository.create({
          userId: input.userId,
          companyId: input.companyId,
          planId: input.planId,
          stripeSubscriptionId: `free_${Date.now()}`, 
          stripeCustomerId: `free_customer_${input.userId || input.companyId}`, 
          status: SubscriptionStatus.ACTIVE,
          billingPeriod: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
        });

        console.log('Free subscription created', {
          subscriptionId: subscription.id,
          userId: input.userId,
          companyId: input.companyId,
          planId: input.planId,
        });

        return subscription;
      }

      const stripePriceId = input.billingPeriod === 'monthly'
        ? plan.stripePriceIdMonthly
        : plan.stripePriceIdYearly;

      if (!stripePriceId) {
        throw new AppError('Stripe price ID not configured for this plan', HttpStatusCode.BAD_REQUEST);
      }

      // Check if existing subscription is cancelled or expired - reactivate instead of creating new
      const isCancelledOrExpired = existingSubscription && (
        existingSubscription.status === SubscriptionStatus.CANCELLED ||
        existingSubscription.currentPeriodEnd <= new Date()
      );

      let customer;
      if (isCancelledOrExpired && existingSubscription.stripeCustomerId) {
        // Reuse existing Stripe customer if available
        try {
          customer = await this._stripeService.getCustomer(existingSubscription.stripeCustomerId);
        } catch (error) {
          // If customer doesn't exist in Stripe, create a new one
          const customerEmail = input.userId ? `user-${input.userId}@example.com` : `company-${input.companyId}@example.com`;
          const customerName = input.userId ? `User ${input.userId}` : `Company ${input.companyId}`;
          customer = await this._stripeService.createCustomer(customerEmail, customerName, {
            userId: input.userId || '',
            companyId: input.companyId || '',
          });
        }
      } else {
        const customerEmail = input.userId ? `user-${input.userId}@example.com` : `company-${input.companyId}@example.com`;
        const customerName = input.userId ? `User ${input.userId}` : `Company ${input.companyId}`;
        customer = await this._stripeService.createCustomer(customerEmail, customerName, {
          userId: input.userId || '',
          companyId: input.companyId || '',
        });
      }

      const stripeSubscription = await this._stripeService.createSubscription(
        customer.id,
        stripePriceId,
        {
          userId: input.userId || '',
          companyId: input.companyId || '',
          planId: input.planId,
        },
      );

      const subData = stripeSubscription as unknown as {
        current_period_start?: number;
        current_period_end?: number;
      };
      
      // If cancelled/expired subscription exists, update it instead of creating new
      if (isCancelledOrExpired) {
        const updatedSubscription = await this._subscriptionRepository.update(existingSubscription!.id, {
          planId: input.planId,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customer.id,
          status: stripeSubscription.status,
          billingPeriod: input.billingPeriod,
          currentPeriodStart: new Date((subData.current_period_start || 0) * 1000),
          currentPeriodEnd: new Date((subData.current_period_end || 0) * 1000),
          cancelAtPeriodEnd: false,
        });

        console.log('Subscription reactivated', {
          subscriptionId: updatedSubscription.id,
          userId: input.userId,
          companyId: input.companyId,
          planId: input.planId,
          previousStatus: existingSubscription!.status,
        });

        return updatedSubscription;
      }
      
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
      throw new AppError(
        'Failed to create subscription. Please try again later.',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCheckoutSession(input: CreateSubscriptionInput): Promise<{ url: string; sessionId: string }> {
    try {
      const plan = await this._subscriptionPlanRepository.findById(input.planId);
      if (!plan) {
        throw new AppError(Messages.SUBSCRIPTION.INVALID_PLAN, HttpStatusCode.BAD_REQUEST);
      }
      const stripePriceId = input.billingPeriod === 'monthly'
        ? plan.stripePriceIdMonthly
        : plan.stripePriceIdYearly;

      const expectedPrice = input.billingPeriod === 'monthly'
        ? plan.priceMonthly
        : plan.priceYearly;

      if (!stripePriceId) {
        throw new AppError('Stripe price ID not configured for this plan', HttpStatusCode.BAD_REQUEST);
      }

      try {
        const stripePrice = await this._stripeService.getPrice(stripePriceId);
        const stripePriceAmount = (stripePrice.unit_amount || 0) / 100;
        
        if (expectedPrice && Math.abs(stripePriceAmount - expectedPrice) > 0.01) {
          console.error(' PRICE MISMATCH DETECTED', {
            planId: plan.id,
            planName: plan.name,
            billingPeriod: input.billingPeriod,
            databasePrice: expectedPrice,
            stripePrice: stripePriceAmount,
            stripePriceId,
          });
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Failed to verify Stripe price', { error: err.message, stripePriceId });

      }

      const customerEmail = input.userId ? `user-${input.userId}@example.com` : `company-${input.companyId}@example.com`;
      const customerName = input.userId ? `User ${input.userId}` : `Company ${input.companyId}`;
      
      const customer = await this._stripeService.createCustomer(customerEmail, customerName, {
        userId: input.userId || '',
        companyId: input.companyId || '',
      });

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
        },
      );


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
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const subscription = await this._subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new AppError(Messages.SUBSCRIPTION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      await this._stripeService.cancelSubscription(subscription.stripeSubscriptionId);

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

      const newStripePriceId = subscription.billingPeriod === 'monthly'
        ? newPlan.stripePriceIdMonthly
        : newPlan.stripePriceIdYearly;

      if (!newStripePriceId) {
        throw new AppError('Stripe price ID not configured for this plan', HttpStatusCode.BAD_REQUEST);
      }

      // Check if subscription is cancelled or expired - cannot update cancelled Stripe subscriptions
      const isCancelledOrExpired = subscription.status === SubscriptionStatus.CANCELLED ||
        subscription.currentPeriodEnd <= new Date();

      if (isCancelledOrExpired) {
        // Cannot update cancelled Stripe subscription - need to create new one
        // Reuse existing customer if available
        let customer;
        if (subscription.stripeCustomerId) {
          try {
            customer = await this._stripeService.getCustomer(subscription.stripeCustomerId);
          } catch (error) {
            // If customer doesn't exist, create new one
            const customerEmail = subscription.userId 
              ? `user-${subscription.userId}@example.com` 
              : `company-${subscription.companyId}@example.com`;
            const customerName = subscription.userId 
              ? `User ${subscription.userId}` 
              : `Company ${subscription.companyId}`;
            customer = await this._stripeService.createCustomer(customerEmail, customerName, {
              userId: subscription.userId || '',
              companyId: subscription.companyId || '',
            });
          }
        } else {
          // No customer ID, create new one
          const customerEmail = subscription.userId 
            ? `user-${subscription.userId}@example.com` 
            : `company-${subscription.companyId}@example.com`;
          const customerName = subscription.userId 
            ? `User ${subscription.userId}` 
            : `Company ${subscription.companyId}`;
          customer = await this._stripeService.createCustomer(customerEmail, customerName, {
            userId: subscription.userId || '',
            companyId: subscription.companyId || '',
          });
        }

        // Create new Stripe subscription
        const newStripeSubscription = await this._stripeService.createSubscription(
          customer.id,
          newStripePriceId,
          {
            userId: subscription.userId || '',
            companyId: subscription.companyId || '',
            planId: newPlanId,
          },
        );

        const subData = newStripeSubscription as unknown as {
          current_period_start?: number;
          current_period_end?: number;
        };

        // Update existing subscription record with new Stripe subscription details
        const updatedSubscription = await this._subscriptionRepository.update(subscriptionId, {
          planId: newPlanId,
          stripeSubscriptionId: newStripeSubscription.id,
          stripeCustomerId: customer.id,
          status: newStripeSubscription.status,
          currentPeriodStart: new Date((subData.current_period_start || 0) * 1000),
          currentPeriodEnd: new Date((subData.current_period_end || 0) * 1000),
          cancelAtPeriodEnd: false,
        });

        console.log('Cancelled subscription reactivated via upgrade', { 
          subscriptionId, 
          newPlanId,
          previousStatus: subscription.status,
        });
        return updatedSubscription;
      }

      // Normal upgrade flow for active subscriptions
      const updatedStripeSubscription = await this._stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        newStripePriceId,
      );

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
      
      // Check if subscription period has expired
      const now = new Date();
      const hasExpired = subscription.currentPeriodEnd <= now;
      
      const isStatusActive = subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIALING;
      const isCancelledButActive = 
        subscription.status === SubscriptionStatus.CANCELLED &&
        subscription.cancelAtPeriodEnd === true &&
        !hasExpired;
      
      // Subscription is active only if status is active AND period hasn't expired
      const isActive = (isStatusActive || isCancelledButActive) && !hasExpired;

      return mapSubscriptionStatusToResponse(
        subscription,
        plan || null,
        features,
        isActive,
      );
    } catch (error) {
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

