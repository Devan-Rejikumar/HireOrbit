import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { SubscriptionPlan } from '@prisma/client';
import { ISubscriptionPlanRepository, PaginationResult } from '../interfaces/ISubscriptionPlanRepository';

@injectable()
export class SubscriptionPlanRepository implements ISubscriptionPlanRepository {
  async findById(id: string): Promise<SubscriptionPlan | null> {
    return prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { features: true },
    });
  }

  async findByNameAndUserType(name: string, userType: string): Promise<SubscriptionPlan | null> {
    return prisma.subscriptionPlan.findUnique({
      where: {
        name_userType: { name, userType },
      },
      include: { features: true },
    });
  }

  async findAllByUserType(userType: string): Promise<SubscriptionPlan[]> {
    return prisma.subscriptionPlan.findMany({
      where: { userType },
      include: { features: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(): Promise<SubscriptionPlan[]> {
    return prisma.subscriptionPlan.findMany({
      include: { features: true },
      orderBy: [{ userType: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllWithPagination(page: number, limit: number, userType?: string): Promise<PaginationResult<SubscriptionPlan>> {
    const skip = (page - 1) * limit;
    const where = userType ? { userType } : {};

    const [data, total] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where,
        include: { features: true },
        orderBy: [{ userType: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.subscriptionPlan.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: {
    name: string;
    userType: string;
    priceMonthly?: number;
    priceYearly?: number;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
  }): Promise<SubscriptionPlan> {
    return prisma.subscriptionPlan.create({
      data,
      include: { features: true },
    });
  }

  async update(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return prisma.subscriptionPlan.update({
      where: { id },
      data,
      include: { features: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.subscriptionPlan.delete({
      where: { id },
    });
  }

  async countActiveSubscriptions(planId: string): Promise<number> {
    return prisma.subscription.count({
      where: {
        planId,
        status: {
          in: ['active', 'trialing', 'past_due'],
        },
      },
    });
  }
}

