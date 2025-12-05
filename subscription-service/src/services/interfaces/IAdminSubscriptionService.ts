import { SubscriptionPlan } from '@prisma/client';

export interface CreatePlanInput {
  name: string;
  userType: 'user' | 'company';
  priceMonthly?: number;
  priceYearly?: number;
  features?: string[];
  description?: string;
}

export interface UpdatePlanInput {
  name?: string;
  priceMonthly?: number;
  priceYearly?: number;
  features?: string[];
  description?: string;
}

export interface UpdatePlanPriceInput {
  priceMonthly?: number;
  priceYearly?: number;
}

export interface IAdminSubscriptionService {
  getAllPlans(): Promise<SubscriptionPlan[]>;
  getPlanById(id: string): Promise<SubscriptionPlan | null>;
  createPlan(input: CreatePlanInput): Promise<SubscriptionPlan>;
  updatePlan(id: string, input: UpdatePlanInput): Promise<SubscriptionPlan>;
  updatePlanPrice(id: string, input: UpdatePlanPriceInput): Promise<SubscriptionPlan>;
  deletePlan(id: string): Promise<void>;
  createDiscount(input: any): Promise<any>;
  updateDiscount(id: string, input: any): Promise<any>;
  deleteDiscount(id: string): Promise<void>;
  getAllDiscounts(): Promise<any[]>;
  getDiscountsByPlan(planId: string): Promise<any[]>;
}

