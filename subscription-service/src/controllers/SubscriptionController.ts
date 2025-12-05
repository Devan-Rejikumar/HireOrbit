import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { ISubscriptionService } from '../services/interfaces/ISubscriptionService';
import { IFeatureService } from '../services/interfaces/IFeatureService';
import { asyncHandler } from '../utils/asyncHandler';
import { buildSuccessResponse, buildErrorResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { AppError } from '../utils/errors/AppError';
import { AuthenticatedRequest } from '../types/request';
import {
  mapSubscriptionToResponse,
  mapSubscriptionPlansToResponse,
  mapSubscriptionStatusToResponse,
} from '../dto/mappers/subscription.mapper';

@injectable()
export class SubscriptionController {
  constructor(
    @inject(TYPES.ISubscriptionService)
    private readonly _subscriptionService: ISubscriptionService,
    @inject(TYPES.IFeatureService)
    private readonly _featureService: IFeatureService,
  ) {}

  getPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userType = req.query.userType as 'user' | 'company';
    
    if (!userType || (userType !== 'user' && userType !== 'company')) {
      throw new AppError(Messages.SUBSCRIPTION.INVALID_USER_TYPE, HttpStatusCode.BAD_REQUEST);
    }

    const plans = await this._subscriptionService.getAllPlans(userType);
    const plansResponse = mapSubscriptionPlansToResponse(plans);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ plans: plansResponse }, Messages.SUBSCRIPTION.PLANS_RETRIEVED)
    );
  });

  createSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { planId, billingPeriod } = req.body;
    const userId = req.user?.userId;
    const companyId = req.user?.companyId;

    if (!planId || !billingPeriod) {
      throw new AppError(Messages.VALIDATION.PLAN_ID_AND_BILLING_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    if (!userId && !companyId) {
      throw new AppError(Messages.VALIDATION.USER_OR_COMPANY_AUTH_REQUIRED, HttpStatusCode.UNAUTHORIZED);
    }
    const plans = await this._subscriptionService.getAllPlans(userId ? 'user' : 'company');
    const plan = plans.find(p => p.id === planId);
    const isFreePlan = plan && (plan.priceMonthly === null || plan.priceMonthly === 0);
    if (isFreePlan) {
      const subscription = await this._subscriptionService.createSubscription({
        userId,
        companyId,
        planId,
        billingPeriod,
      });

      const subscriptionResponse = mapSubscriptionToResponse(subscription as any);

      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ subscription: subscriptionResponse }, Messages.SUBSCRIPTION.CREATED_SUCCESS)
      );
      return;
    }
    const checkoutSession = await this._subscriptionService.createCheckoutSession({
      userId,
      companyId,
      planId,
      billingPeriod,
    });

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(
        { checkoutUrl: checkoutSession.url, sessionId: checkoutSession.sessionId },
        'Checkout session created. Redirect to checkout URL to complete payment.'
      )
    );
  });

  cancelSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      throw new AppError(Messages.VALIDATION.SUBSCRIPTION_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    await this._subscriptionService.cancelSubscription(subscriptionId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.SUBSCRIPTION.CANCELLED_SUCCESS)
    );
  });

  upgradeSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { subscriptionId } = req.params;
    const { newPlanId } = req.body;

    if (!subscriptionId || !newPlanId) {
      throw new AppError(Messages.VALIDATION.SUBSCRIPTION_AND_PLAN_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const subscription = await this._subscriptionService.upgradeSubscription(subscriptionId, newPlanId);

    const subscriptionResponse = mapSubscriptionToResponse(subscription as any);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ subscription: subscriptionResponse }, Messages.SUBSCRIPTION.UPGRADE_SUCCESS)
    );
  });

  getSubscriptionStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const companyId = req.user?.companyId;

    if (!userId && !companyId) {
      throw new AppError(Messages.VALIDATION.USER_OR_COMPANY_AUTH_REQUIRED, HttpStatusCode.UNAUTHORIZED);
    }

    const status = await this._subscriptionService.getSubscriptionStatus(userId, companyId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(status, Messages.SUBSCRIPTION.STATUS_RETRIEVED)
    );
  });

  checkJobPostingLimit = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError(Messages.VALIDATION.COMPANY_AUTH_REQUIRED, HttpStatusCode.UNAUTHORIZED);
    }

    const limitInfo = await this._featureService.checkJobPostingLimit(companyId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(limitInfo, Messages.FEATURE.JOB_LIMIT_RETRIEVED)
    );
  });

  checkFeatureAccess = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { featureName } = req.params;
    const userId = req.user?.userId;
    const companyId = req.user?.companyId;

    if (!featureName) {
      throw new AppError(Messages.VALIDATION.FEATURE_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const hasAccess = await this._featureService.checkFeatureAccess(userId, companyId, featureName);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ hasAccess, featureName }, Messages.FEATURE.FEATURE_ACCESS_CHECKED)
    );
  });

  incrementJobPostingCount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const companyId = req.user?.companyId || req.body?.companyId;

    if (!companyId) {
      throw new AppError(Messages.VALIDATION.COMPANY_AUTH_REQUIRED, HttpStatusCode.UNAUTHORIZED);
    }

    await this._featureService.incrementJobPostingCount(companyId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({}, 'Job posting count incremented successfully')
    );
  });
}

