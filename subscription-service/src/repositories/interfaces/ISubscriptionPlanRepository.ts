import { SubscriptionPlan } from '@prisma/client';

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlan | null>;
  findByNameAndUserType(name: string, userType: string): Promise<SubscriptionPlan | null>;
  findAllByUserType(userType: string): Promise<SubscriptionPlan[]>;
  findAll(): Promise<SubscriptionPlan[]>;
  create(data: {
    name: string;
    userType: string;
    priceMonthly?: number;
    priceYearly?: number;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
  }): Promise<SubscriptionPlan>;
  update(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  delete(id: string): Promise<void>;
  countActiveSubscriptions(planId: string): Promise<number>;
}

