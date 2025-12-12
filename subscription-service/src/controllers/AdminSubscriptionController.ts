import { injectable, inject } from 'inversify';
import { Response } from 'express';
import TYPES from '../config/types';
import { IAdminSubscriptionService } from '../services/interfaces/IAdminSubscriptionService';
import { asyncHandler } from '../utils/asyncHandler';
import { buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AuthenticatedRequest } from '../types/request';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class AdminSubscriptionController {
  constructor(
    @inject(TYPES.IAdminSubscriptionService)
    private readonly _adminSubscriptionService: IAdminSubscriptionService,
  ) {}

  getAllPlans = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const plans = await this._adminSubscriptionService.getAllPlans();
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ plans }, 'Subscription plans retrieved successfully'),
    );
  });

  createPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, userType, priceMonthly, priceYearly, features, description } = req.body;

    if (!name || !userType) {
      throw new AppError('Name and userType are required', HttpStatusCode.BAD_REQUEST);
    }

    if (userType !== 'user' && userType !== 'company') {
      throw new AppError('userType must be either "user" or "company"', HttpStatusCode.BAD_REQUEST);
    }

    const plan = await this._adminSubscriptionService.createPlan({
      name,
      userType,
      priceMonthly,
      priceYearly,
      features,
      description,
    });

    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ plan }, 'Subscription plan created successfully'),
    );
  });

  getPlanById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const plan = await this._adminSubscriptionService.getPlanById(id);
    
    if (!plan) {
      throw new AppError('Subscription plan not found', HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ plan }, 'Subscription plan retrieved successfully'),
    );
  });

  updatePlan = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, priceMonthly, priceYearly, features, description } = req.body;

    const updatedPlan = await this._adminSubscriptionService.updatePlan(id, {
      name,
      priceMonthly,
      priceYearly,
      features,
      description,
    });

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ plan: updatedPlan }, 'Subscription plan updated successfully'),
    );
  });

  updatePlanPrice = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { priceMonthly, priceYearly } = req.body;

    if (priceMonthly === undefined && priceYearly === undefined) {
      throw new AppError('At least one price (monthly or yearly) must be provided', HttpStatusCode.BAD_REQUEST);
    }

    if (priceMonthly !== undefined && priceMonthly < 0) {
      throw new AppError('Monthly price must be non-negative', HttpStatusCode.BAD_REQUEST);
    }

    if (priceYearly !== undefined && priceYearly < 0) {
      throw new AppError('Yearly price must be non-negative', HttpStatusCode.BAD_REQUEST);
    }

    const updatedPlan = await this._adminSubscriptionService.updatePlanPrice(id, {
      priceMonthly,
      priceYearly,
    });

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ plan: updatedPlan }, 'Plan price updated successfully and synced with Stripe'),
    );
  });

  deletePlan = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    await this._adminSubscriptionService.deletePlan(id);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, 'Subscription plan deleted successfully'),
    );
  });

  createDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { planId, name, percentage, startDate, endDate } = req.body;

    if (!planId || !name || percentage === undefined || !startDate || !endDate) {
      throw new AppError('All fields are required: planId, name, percentage, startDate, endDate', HttpStatusCode.BAD_REQUEST);
    }

    if (percentage < 0 || percentage > 100) {
      throw new AppError('Percentage must be between 0 and 100', HttpStatusCode.BAD_REQUEST);
    }

    const discount = await this._adminSubscriptionService.createDiscount({
      planId,
      name,
      percentage,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ discount }, 'Discount created successfully and synced with Stripe'),
    );
  });

  updateDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, percentage, startDate, endDate, isActive } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (percentage !== undefined) {
      if (percentage < 0 || percentage > 100) {
        throw new AppError('Percentage must be between 0 and 100', HttpStatusCode.BAD_REQUEST);
      }
      updateData.percentage = percentage;
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDiscount = await this._adminSubscriptionService.updateDiscount(id, updateData);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ discount: updatedDiscount }, 'Discount updated successfully'),
    );
  });

  deleteDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    await this._adminSubscriptionService.deleteDiscount(id);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, 'Discount deleted successfully'),
    );
  });

  getAllDiscounts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const discounts = await this._adminSubscriptionService.getAllDiscounts();
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ discounts }, 'Discounts retrieved successfully'),
    );
  });

  getDiscountsByPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { planId } = req.params;
    const discounts = await this._adminSubscriptionService.getDiscountsByPlan(planId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ discounts }, 'Discounts retrieved successfully'),
    );
  });
}

