import { Subscription } from '@prisma/client';

export interface ISubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
  findByUserId(userId: string): Promise<Subscription | null>;
  findByCompanyId(companyId: string): Promise<Subscription | null>;
  create(data: {
    userId?: string;
    companyId?: string;
    planId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<Subscription>;
  update(id: string, data: Partial<Subscription>): Promise<Subscription>;
  updateByStripeSubscriptionId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription>;
  delete(id: string): Promise<void>;
}

