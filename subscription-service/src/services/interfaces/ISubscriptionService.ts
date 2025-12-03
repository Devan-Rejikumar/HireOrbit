import { Subscription, SubscriptionPlan } from '@prisma/client';
import { SubscriptionStatusResponse } from '../../dto/responses/subscription.response';

export interface CreateSubscriptionInput {
  userId?: string;
  companyId?: string;
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
}

export interface ISubscriptionService {
  createSubscription(input: CreateSubscriptionInput): Promise<Subscription>;
  createCheckoutSession(input: CreateSubscriptionInput): Promise<{ url: string; sessionId: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription>;
  downgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription>;
  getSubscriptionStatus(userId?: string, companyId?: string): Promise<SubscriptionStatusResponse>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null>;
  updateSubscriptionFromWebhook(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription>;
  getAllPlans(userType: 'user' | 'company'): Promise<SubscriptionPlan[]>;
}

