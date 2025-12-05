import { injectable } from 'inversify';
import { PrismaClient, Transaction } from '@prisma/client';
import { ITransactionRepository, CreateTransactionInput, TransactionFilters } from '../interfaces/ITransactionRepository';

const prisma = new PrismaClient();

@injectable()
export class TransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        subscriptionId: input.subscriptionId,
        userId: input.userId,
        companyId: input.companyId,
        planId: input.planId,
        amount: input.amount,
        currency: input.currency || 'inr',
        status: input.status,
        stripeInvoiceId: input.stripeInvoiceId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        billingPeriod: input.billingPeriod,
        paymentDate: input.paymentDate,
      },
      include: {
        plan: true,
        subscription: true,
      },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        plan: true,
        subscription: true,
      },
    });
  }

  async findByStripeInvoiceId(invoiceId: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { stripeInvoiceId: invoiceId },
      include: {
        plan: true,
        subscription: true,
      },
    });
  }

  async findMany(filters?: TransactionFilters): Promise<Transaction[]> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }
    if (filters?.planId) {
      where.planId = filters.planId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.userType) {
      if (filters.userType === 'user') {
        where.userId = { not: null };
      } else if (filters.userType === 'company') {
        where.companyId = { not: null };
      }
    }
    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    return prisma.transaction.findMany({
      where,
      include: {
        plan: true,
        subscription: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
      take: filters?.limit,
      skip: filters?.offset,
    });
  }

  async count(filters?: TransactionFilters): Promise<number> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }
    if (filters?.planId) {
      where.planId = filters.planId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.userType) {
      if (filters.userType === 'user') {
        where.userId = { not: null };
      } else if (filters.userType === 'company') {
        where.companyId = { not: null };
      }
    }
    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    return prisma.transaction.count({ where });
  }

  async getTotalRevenue(filters?: Omit<TransactionFilters, 'limit' | 'offset'>): Promise<number> {
    const where: any = {
      status: 'succeeded', // Only count successful payments
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }
    if (filters?.planId) {
      where.planId = filters.planId;
    }
    if (filters?.userType) {
      if (filters.userType === 'user') {
        where.userId = { not: null };
      } else if (filters.userType === 'company') {
        where.companyId = { not: null };
      }
    }
    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    const result = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  async getRevenueByUserType(filters?: Omit<TransactionFilters, 'limit' | 'offset'>): Promise<{ user: number; company: number }> {
    const where: any = {
      status: 'succeeded',
    };

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }
    
    if (filters?.userType) {
      if (filters.userType === 'user') {
        where.userId = { not: null };
      } else if (filters.userType === 'company') {
        where.companyId = { not: null };
      }
    }

    const [userRevenue, companyRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          userId: { not: null },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          companyId: { not: null },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      user: userRevenue._sum.amount || 0,
      company: companyRevenue._sum.amount || 0,
    };
  }

  async getRevenueByPlan(filters?: Omit<TransactionFilters, 'limit' | 'offset'>): Promise<Array<{ planId: string; planName: string; userType: string; revenue: number }>> {
    const where: any = {
      status: 'succeeded',
    };

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }
    
    if (filters?.userType) {
      if (filters.userType === 'user') {
        where.userId = { not: null };
      } else if (filters.userType === 'company') {
        where.companyId = { not: null };
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        plan: true,
      },
    });

    const revenueByPlan = new Map<string, { planId: string; planName: string; userType: string; revenue: number }>();

    transactions.forEach((transaction) => {
      const key = transaction.planId;
      if (!revenueByPlan.has(key)) {
        revenueByPlan.set(key, {
          planId: transaction.plan.id,
          planName: transaction.plan.name,
          userType: transaction.plan.userType,
          revenue: 0,
        });
      }
      const entry = revenueByPlan.get(key)!;
      entry.revenue += transaction.amount;
    });

    return Array.from(revenueByPlan.values()).sort((a, b) => b.revenue - a.revenue);
  }

  async getRevenueByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month', userType?: 'user' | 'company'): Promise<Array<{ period: string; revenue: number }>> {
    const where: any = {
      status: 'succeeded',
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
    };
    
    if (userType) {
      if (userType === 'user') {
        where.userId = { not: null };
      } else if (userType === 'company') {
        where.companyId = { not: null };
      }
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        paymentDate: true,
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    const grouped = new Map<string, number>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.paymentDate);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]; 
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
      } else {
  
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }

      grouped.set(key, (grouped.get(key) || 0) + transaction.amount);
    });

    const allPeriods = new Map<string, number>();
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      let key: string;

      if (groupBy === 'day') {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (groupBy === 'week') {
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7);
      } else {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      }

      allPeriods.set(key, grouped.get(key) || 0);
    }

    return Array.from(allPeriods.entries())
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}

