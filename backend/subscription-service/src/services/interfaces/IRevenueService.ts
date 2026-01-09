export interface RevenueStatistics {
  totalRevenue: number;
  revenueByUserType: {
    user: number;
    company: number;
  };
  revenueByPlan: Array<{
    planId: string;
    planName: string;
    userType: string;
    revenue: number;
  }>;
  revenueByTimePeriod: Array<{
    period: string;
    revenue: number;
  }>;
}

export interface TransactionHistoryResponse {
  transactions: Array<{
    id: string;
    subscriptionId?: string;
    userId?: string;
    companyId?: string;
    planId: string;
    planName: string;
    userType: string;
    amount: number;
    currency: string;
    status: string;
    billingPeriod: string;
    paymentDate: Date;
    stripeInvoiceId?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface IRevenueService {
  getRevenueStatistics(startDate?: Date, endDate?: Date, userType?: 'user' | 'company'): Promise<RevenueStatistics>;
  getTransactionHistory(filters?: {
    userId?: string;
    companyId?: string;
    planId?: string;
    status?: string;
    userType?: 'user' | 'company';
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<TransactionHistoryResponse>;
  syncTransactionsFromStripe(limit?: number): Promise<{ synced: number; skipped: number; errors: number }>;
}

