import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { IAdminSubscriptionService, CreatePlanInput, UpdatePlanInput, UpdatePlanPriceInput } from '../interfaces/IAdminSubscriptionService';
import { ISubscriptionPlanRepository } from '../../repositories/interfaces/ISubscriptionPlanRepository';
import { IStripeService } from '../interfaces/IStripeService';
import { SubscriptionPlan } from '@prisma/client';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { prisma } from '../../prisma/client';

@injectable()
export class AdminSubscriptionService implements IAdminSubscriptionService {
  constructor(
    @inject(TYPES.ISubscriptionPlanRepository)
    private readonly _planRepository: ISubscriptionPlanRepository,
    @inject(TYPES.IStripeService)
    private readonly _stripeService: IStripeService,
  ) {}

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return this._planRepository.findAll();
  }

  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    return this._planRepository.findById(id);
  }

  async createPlan(input: CreatePlanInput): Promise<SubscriptionPlan> {
    if (input.userType !== 'user' && input.userType !== 'company') {
      throw new AppError('Invalid userType. Must be "user" or "company"', HttpStatusCode.BAD_REQUEST);
    }
    const existingPlan = await this._planRepository.findByNameAndUserType(input.name, input.userType);
    if (existingPlan) {
      throw new AppError(`Plan with name "${input.name}" already exists for ${input.userType}`, HttpStatusCode.CONFLICT);
    }
    if (input.priceMonthly !== undefined && input.priceMonthly < 0) {
      throw new AppError('Monthly price must be non-negative', HttpStatusCode.BAD_REQUEST);
    }
    if (input.priceYearly !== undefined && input.priceYearly < 0) {
      throw new AppError('Yearly price must be non-negative', HttpStatusCode.BAD_REQUEST);
    }

    let stripePriceIdMonthly: string | undefined;
    let stripePriceIdYearly: string | undefined;

    const isFreePlan = (!input.priceMonthly || input.priceMonthly === 0) && (!input.priceYearly || input.priceYearly === 0);
    
    if (!isFreePlan) {
      try {
        const productName = `${input.name} - ${input.userType}`;
        const product = await this._stripeService.createProduct(productName, input.description, {
          planName: input.name,
          userType: input.userType,
        });
        if (input.priceMonthly && input.priceMonthly > 0) {
          const monthlyPrice = await this._stripeService.createPrice(
            product.id,
            input.priceMonthly,
            'inr',
            'month',
            { planName: input.name, userType: input.userType, billingPeriod: 'monthly' }
          );
          stripePriceIdMonthly = monthlyPrice.id;
        }
        if (input.priceYearly && input.priceYearly > 0) {
          const yearlyPrice = await this._stripeService.createPrice(
            product.id,
            input.priceYearly,
            'inr',
            'year',
            { planName: input.name, userType: input.userType, billingPeriod: 'yearly' }
          );
          stripePriceIdYearly = yearlyPrice.id;
        }
      } catch (error: any) {
        console.error('Failed to create Stripe product/prices', { error: error.message });
        throw new AppError(`Failed to create Stripe product: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
    const plan = await this._planRepository.create({
      name: input.name,
      userType: input.userType,
      priceMonthly: input.priceMonthly ?? undefined,
      priceYearly: input.priceYearly ?? undefined,
      stripePriceIdMonthly: stripePriceIdMonthly ?? undefined,
      stripePriceIdYearly: stripePriceIdYearly ?? undefined,
    });

    if (input.features && input.features.length > 0) {
      await this.addFeaturesToPlan(plan.id, input.features);
    }
    return this._planRepository.findById(plan.id) as Promise<SubscriptionPlan>;
  }

  async updatePlan(id: string, input: UpdatePlanInput): Promise<SubscriptionPlan> {
    const plan = await this._planRepository.findById(id);
    if (!plan) {
      throw new AppError('Subscription plan not found', HttpStatusCode.NOT_FOUND);
    }
    if (input.features !== undefined) {
      await this.removeAllFeaturesFromPlan(id);
      if (input.features.length > 0) {
        await this.addFeaturesToPlan(id, input.features);
      }
    }
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    const priceChanged = (input.priceMonthly !== undefined && input.priceMonthly !== plan.priceMonthly) ||
                         (input.priceYearly !== undefined && input.priceYearly !== plan.priceYearly);
    
    if (priceChanged) {
      const priceUpdateInput: UpdatePlanPriceInput = {};
      if (input.priceMonthly !== undefined) {
        if (input.priceMonthly < 0) {
          throw new AppError('Monthly price must be non-negative', HttpStatusCode.BAD_REQUEST);
        }
        priceUpdateInput.priceMonthly = input.priceMonthly;
      }
      if (input.priceYearly !== undefined) {
        if (input.priceYearly < 0) {
          throw new AppError('Yearly price must be non-negative', HttpStatusCode.BAD_REQUEST);
        }
        priceUpdateInput.priceYearly = input.priceYearly;
      }
      return this.updatePlanPrice(id, priceUpdateInput);
    }

    const updatedPlan = await this._planRepository.update(id, updateData);
    return updatedPlan;
  }

  async updatePlanPrice(id: string, input: UpdatePlanPriceInput): Promise<SubscriptionPlan> {
    const plan = await this._planRepository.findById(id);
    if (!plan) {
      throw new AppError('Subscription plan not found', HttpStatusCode.NOT_FOUND);
    }

    if (input.priceMonthly === undefined && input.priceYearly === undefined) {
      throw new AppError('At least one price must be provided', HttpStatusCode.BAD_REQUEST);
    }

    if (input.priceMonthly !== undefined && input.priceMonthly < 0) {
      throw new AppError('Monthly price must be non-negative', HttpStatusCode.BAD_REQUEST);
    }
    if (input.priceYearly !== undefined && input.priceYearly < 0) {
      throw new AppError('Yearly price must be non-negative', HttpStatusCode.BAD_REQUEST);
    }

    const updateData: any = {};
    let productId: string | null = null;
    if (plan.stripePriceIdMonthly) {
      try {
        const existingPrice = await this._stripeService.getPrice(plan.stripePriceIdMonthly);
        productId = typeof existingPrice.product === 'string' ? existingPrice.product : existingPrice.product.id;
      } catch (error: any) {
        console.error('Failed to retrieve product ID from monthly price', { error: error.message });
      }
    } else if (plan.stripePriceIdYearly) {
      try {
        const existingPrice = await this._stripeService.getPrice(plan.stripePriceIdYearly);
        productId = typeof existingPrice.product === 'string' ? existingPrice.product : existingPrice.product.id;
      } catch (error: any) {
        console.error('Failed to retrieve product ID from yearly price', { error: error.message });
      }
    }

    if (input.priceMonthly !== undefined && input.priceMonthly !== plan.priceMonthly) {
      updateData.priceMonthly = input.priceMonthly;
      if (plan.stripePriceIdMonthly) {
        try {
          await this._stripeService.updatePrice(plan.stripePriceIdMonthly, undefined, false);
        } catch (error: any) {
          console.error('Failed to archive old monthly price', { error: error.message });
        }
      }
      if (input.priceMonthly > 0 && productId) {
        try {
          const newMonthlyPrice = await this._stripeService.createPrice(
            productId,
            input.priceMonthly,
            'inr',
            'month',
            { planName: plan.name, userType: plan.userType, billingPeriod: 'monthly' }
          );
          updateData.stripePriceIdMonthly = newMonthlyPrice.id;
        } catch (error: any) {
          console.error('Failed to create new monthly price in Stripe', { error: error.message });
          throw new AppError(`Failed to create new Stripe price: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      } else if (input.priceMonthly === 0 || input.priceMonthly === null) {
        updateData.stripePriceIdMonthly = null;
      }
    }

    if (input.priceYearly !== undefined && input.priceYearly !== plan.priceYearly) {
      updateData.priceYearly = input.priceYearly;
      if (plan.stripePriceIdYearly) {
        try {
          await this._stripeService.updatePrice(plan.stripePriceIdYearly, undefined, false);
        } catch (error: any) {
          console.error('Failed to archive old yearly price', { error: error.message });
        }
      }

      if (input.priceYearly > 0 && productId) {
        try {
          const newYearlyPrice = await this._stripeService.createPrice(
            productId,
            input.priceYearly,
            'inr',
            'year',
            { planName: plan.name, userType: plan.userType, billingPeriod: 'yearly' }
          );
          updateData.stripePriceIdYearly = newYearlyPrice.id;
        } catch (error: any) {
          console.error('Failed to create new yearly price in Stripe', { error: error.message });
          throw new AppError(`Failed to create new Stripe price: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      } else if (input.priceYearly === 0 || input.priceYearly === null) {
        updateData.stripePriceIdYearly = null;
      }
    }

    const updatedPlan = await this._planRepository.update(id, updateData);
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this._planRepository.findById(id);
    if (!plan) {
      throw new AppError('Subscription plan not found', HttpStatusCode.NOT_FOUND);
    }
    const activeSubscriptions = await this._planRepository.countActiveSubscriptions(id);
    if (activeSubscriptions > 0) {
      throw new AppError(
        `Cannot delete plan. There are ${activeSubscriptions} active subscription(s) using this plan.`,
        HttpStatusCode.CONFLICT
      );
    }

    if (plan.stripePriceIdMonthly || plan.stripePriceIdYearly) {
      console.warn('Stripe product archiving not implemented. Product should be archived manually in Stripe dashboard.');
    }

    await this._planRepository.delete(id);
  }

  private async addFeaturesToPlan(planId: string, featureNames: string[]): Promise<void> {
    for (const featureName of featureNames) {
      try {
        await prisma.subscriptionFeature.create({
          data: {
            name: featureName,
            planId,
          },
        });
      } catch (error: any) {
        if (!error.message?.includes('Unique constraint')) {
          console.error('Failed to add feature to plan', { error: error.message, featureName, planId });
        }
      }
    }
  }

  private async removeAllFeaturesFromPlan(planId: string): Promise<void> {
    await prisma.subscriptionFeature.deleteMany({
      where: { planId },
    });
  }

  async createDiscount(input: any): Promise<any> {
    throw new AppError('Discount functionality not implemented', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  async updateDiscount(id: string, input: any): Promise<any> {
    throw new AppError('Discount functionality not implemented', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  async deleteDiscount(id: string): Promise<void> {
    throw new AppError('Discount functionality not implemented', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  async getAllDiscounts(): Promise<any[]> {
    return [];
  }

  async getDiscountsByPlan(planId: string): Promise<any[]> {
    return [];
  }
}

