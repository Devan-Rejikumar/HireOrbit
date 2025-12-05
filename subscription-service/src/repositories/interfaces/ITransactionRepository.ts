import { Transaction } from '@prisma/client';

export interface CreateTransactionInput {
  subscriptionId?: string;
  userId?: string;
  companyId?: string;
  planId: string;
  amount: number;
  currency?: string;
  status: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  billingPeriod: string;
  paymentDate: Date;
}

export interface TransactionFilters {
  userId?: string;
  companyId?: string;
  subscriptionId?: string;
  planId?: string;
  status?: string;
  userType?: 'user' | 'company';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ITransactionRepository {
  create(input: CreateTransactionInput): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByStripeInvoiceId(invoiceId: string): Promise<Transaction | null>;
  findMany(filters?: TransactionFilters): Promise<Transaction[]>;
  count(filters?: TransactionFilters): Promise<number>;
  getTotalRevenue(filters?: Omit<TransactionFilters, 'limit' | 'offset'>): Promise<number>;
  getRevenueByUserType(filters?: Omit<TransactionFilters, 'limit' | 'offset'>): Promise<{ user: number; company: number }>;
  getRevenueByPlan(filters?: Omit<TransactionFilters, 'limit' | 'offset'>): Promise<Array<{ planId: string; planName: string; userType: string; revenue: number }>>;
  getRevenueByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month', userType?: 'user' | 'company'): Promise<Array<{ period: string; revenue: number }>>;
}

