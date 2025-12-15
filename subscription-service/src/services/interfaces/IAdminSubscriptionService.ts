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

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAdminSubscriptionService {
  getAllPlans(page?: number, limit?: number, userType?: string): Promise<PaginationResult<SubscriptionPlan>>;
  getPlanById(id: string): Promise<SubscriptionPlan | null>;
  createPlan(input: CreatePlanInput): Promise<SubscriptionPlan>;
  updatePlan(id: string, input: UpdatePlanInput): Promise<SubscriptionPlan>;
  updatePlanPrice(id: string, input: UpdatePlanPriceInput): Promise<SubscriptionPlan>;
  deletePlan(id: string): Promise<void>;
  createDiscount(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateDiscount(id: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteDiscount(id: string): Promise<void>;
  getAllDiscounts(): Promise<Record<string, unknown>[]>;
  getDiscountsByPlan(planId: string): Promise<Record<string, unknown>[]>;
}

