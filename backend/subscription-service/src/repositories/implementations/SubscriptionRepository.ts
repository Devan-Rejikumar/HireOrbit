import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { Subscription } from '@prisma/client';
import { ISubscriptionRepository } from '../interfaces/ISubscriptionRepository';

@injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { id },
      include: { plan: { include: { features: true } } },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: { plan: { include: { features: true } } },
    });
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: { userId },
      include: { plan: { include: { features: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCompanyId(companyId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: { companyId },
      include: { plan: { include: { features: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    userId?: string;
    companyId?: string;
    planId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<Subscription> {
    return prisma.subscription.create({
      data,
      include: { plan: { include: { features: true } } },
    });
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data,
      include: { plan: { include: { features: true } } },
    });
  }

  async updateByStripeSubscriptionId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription> {
    return prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
      include: { plan: { include: { features: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.subscription.delete({ where: { id } });
  }
}

