import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import TYPES from '../config/types';
import { IAchievementService } from '../services/interfaces/IAchievementService';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class AchievementController {
  constructor(@inject(TYPES.IAchievementService) private _achievementService: IAchievementService) {}

  async addAchievement(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const achievementData = req.body;
    const result = await this._achievementService.addAchievement(userId, achievementData);
    
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse(result, Messages.ACHIEVEMENT.ADDED_SUCCESS)
    );
  }

  async getAchievements(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const achievements = await this._achievementService.getAchievements(userId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(achievements, Messages.ACHIEVEMENT.RETRIEVED_ALL_SUCCESS)
    );
  }

  async updateAchievement(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const { achievementId } = req.params;
    if (!achievementId) {
      throw new AppError(Messages.ACHIEVEMENT.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const updates = req.body;
    const result = await this._achievementService.updateAchievement(userId, achievementId, updates);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.ACHIEVEMENT.UPDATED_SUCCESS)
    );
  }

  async deleteAchievement(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const { achievementId } = req.params;
    if (!achievementId) {
      throw new AppError(Messages.ACHIEVEMENT.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    
    await this._achievementService.deleteAchievement(userId, achievementId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.ACHIEVEMENT.DELETED_SUCCESS)
    );
  }

  async getAchievementById(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const { achievementId } = req.params;
    if (!achievementId) {
      throw new AppError(Messages.ACHIEVEMENT.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const achievement = await this._achievementService.getAchievementById(userId, achievementId);
    
    if (!achievement) {
      throw new AppError(Messages.ACHIEVEMENT.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(achievement, Messages.ACHIEVEMENT.RETRIEVED_SUCCESS)
    );
  }
}