import { Subscription, SubscriptionPlan, SubscriptionFeature } from '@prisma/client';
import {
  SubscriptionResponse,
  SubscriptionPlanResponse,
  SubscriptionStatusResponse,
} from '../responses/subscription.response';

export function mapSubscriptionPlanToResponse(
  plan: SubscriptionPlan & { features?: SubscriptionFeature[] }
): SubscriptionPlanResponse {
  return {
    id: plan.id,
    name: plan.name,
    userType: plan.userType,
    priceMonthly: plan.priceMonthly || undefined,
    priceYearly: plan.priceYearly || undefined,
    features: plan.features?.map((f) => f.name) || [],
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export function mapSubscriptionPlansToResponse(
  plans: (SubscriptionPlan & { features?: SubscriptionFeature[] })[]
): SubscriptionPlanResponse[] {
  return plans.map(mapSubscriptionPlanToResponse);
}

export function mapSubscriptionToResponse(
  subscription: Subscription & {
    plan?: SubscriptionPlan & { features?: SubscriptionFeature[] };
  }
): SubscriptionResponse {
  return {
    id: subscription.id,
    userId: subscription.userId || undefined,
    companyId: subscription.companyId || undefined,
    planId: subscription.planId,
    plan: subscription.plan ? mapSubscriptionPlanToResponse(subscription.plan) : undefined,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCustomerId: subscription.stripeCustomerId,
    status: subscription.status,
    billingPeriod: subscription.billingPeriod,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

export function mapSubscriptionStatusToResponse(
  subscription: Subscription | null,
  plan: SubscriptionPlan | null,
  features: string[],
  isActive: boolean
): SubscriptionStatusResponse {
  const subscriptionWithPlan = subscription as unknown as {
    plan?: SubscriptionPlan & { features?: SubscriptionFeature[] };
  } | null;

  const planWithFeatures = plan as unknown as (SubscriptionPlan & { features?: SubscriptionFeature[] }) | null;

  return {
    subscription: subscription
      ? mapSubscriptionToResponse({
          ...subscription,
          plan: subscriptionWithPlan?.plan,
        })
      : null,
    plan: planWithFeatures
      ? mapSubscriptionPlanToResponse(planWithFeatures)
      : null,
    features,
    isActive,
  };
}

