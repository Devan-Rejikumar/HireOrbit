import { injectable, inject } from 'inversify';
import { Response } from 'express';
import TYPES from '../config/types';
import { IRevenueService } from '../services/interfaces/IRevenueService';
import { asyncHandler } from '../utils/asyncHandler';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AuthenticatedRequest } from '../types/request';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class AdminRevenueController {
  constructor(
    @inject(TYPES.IRevenueService)
    private readonly _revenueService: IRevenueService,
  ) {}

  getRevenueStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate) {
      const dateStr = req.query.startDate as string;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        startDate = new Date(dateStr + 'T00:00:00.000Z');
      } else {
        startDate = new Date(dateStr);
      }
      if (isNaN(startDate.getTime())) {
        throw new AppError('Invalid startDate format', HttpStatusCode.BAD_REQUEST);
      }
    }

    if (req.query.endDate) {
      const dateStr = req.query.endDate as string;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        endDate = new Date(dateStr + 'T23:59:59.999Z');
      } else {
        endDate = new Date(dateStr);
      }
      if (isNaN(endDate.getTime())) {
        throw new AppError('Invalid endDate format', HttpStatusCode.BAD_REQUEST);
      }
    }

    const userType = req.query.userType as 'user' | 'company' | undefined;

    if (userType && userType !== 'user' && userType !== 'company') {
      throw new AppError('Invalid userType. Must be "user" or "company"', HttpStatusCode.BAD_REQUEST);
    }

    const statistics = await this._revenueService.getRevenueStatistics(startDate, endDate, userType);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ statistics }, 'Revenue statistics retrieved successfully'),
    );
  });

  getTransactionHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      userId,
      companyId,
      planId,
      status,
      userType,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filters: Parameters<IRevenueService['getTransactionHistory']>[0] = {};

    if (userId) filters.userId = userId as string;
    if (companyId) filters.companyId = companyId as string;
    if (planId) filters.planId = planId as string;
    if (status) filters.status = status as string;
    if (userType && (userType === 'user' || userType === 'company')) {
      filters.userType = userType as 'user' | 'company';
    }
    if (startDate) {
      const dateStr = startDate as string;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        filters.startDate = new Date(dateStr + 'T00:00:00.000Z');
      } else {
        filters.startDate = new Date(dateStr);
      }
      if (isNaN(filters.startDate.getTime())) {
        throw new AppError('Invalid startDate format', HttpStatusCode.BAD_REQUEST);
      }
    }
    if (endDate) {
      const dateStr = endDate as string;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        filters.endDate = new Date(dateStr + 'T23:59:59.999Z');
      } else {
        filters.endDate = new Date(dateStr);
      }
      if (isNaN(filters.endDate.getTime())) {
        throw new AppError('Invalid endDate format', HttpStatusCode.BAD_REQUEST);
      }
    }
    if (page) filters.page = parseInt(page as string, 10);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const history = await this._revenueService.getTransactionHistory(filters);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(history, 'Transaction history retrieved successfully'),
    );
  });

  syncTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log('Sync transactions endpoint called', { query: req.query });
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    if (limit < 1 || limit > 1000) {
      throw new AppError('Limit must be between 1 and 1000', HttpStatusCode.BAD_REQUEST);
    }

    console.log('Starting sync with limit', { limit });
    const result = await this._revenueService.syncTransactionsFromStripe(limit);
    console.log('Sync completed', result);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, `Synced ${result.synced} transactions, skipped ${result.skipped}, ${result.errors} errors`),
    );
  });
}

