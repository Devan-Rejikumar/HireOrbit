import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { IAchievementService } from '../services/IAchievementService';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType: string;
  };
}

@injectable()
export class AchievementController {
  constructor(@inject('IAchievementService') private achievementService: IAchievementService) {}

  async addAchievement(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      const achievementData = req.body;
      const result = await this.achievementService.addAchievement(userId, achievementData);
      
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse(result, 'Achievement added successfully')
      );
    } catch (error) {
      console.error('Error adding achievement:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to add achievement', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async getAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      const achievements = await this.achievementService.getAchievements(userId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(achievements, 'Achievements retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting achievements:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to get achievements', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async updateAchievement(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const { achievementId } = req.params;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      if (!achievementId) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Achievement ID is required', 'BAD_REQUEST')
        );
        return;
      }

      const updates = req.body;
      console.log('🔍 [ACHIEVEMENT-CONTROLLER] Received update data:', JSON.stringify(updates, null, 2));
      const result = await this.achievementService.updateAchievement(userId, achievementId, updates);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Achievement updated successfully')
      );
    } catch (error) {
      console.error('Error updating achievement:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to update achievement', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async deleteAchievement(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const { achievementId } = req.params;
      
      console.log('DELETE-ACHIEVEMENT User ID:', userId);
      console.log('DELETE-ACHIEVEMENT Achievement ID:', achievementId);
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      if (!achievementId) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Achievement ID is required', 'BAD_REQUEST')
        );
        return;
      }

      await this.achievementService.deleteAchievement(userId, achievementId);
      
      console.log('DELETE-ACHIEVEMENT Achievement deleted successfully');
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Achievement deleted successfully')
      );
    } catch (error) {
      console.error('DELETE-ACHIEVEMENT Error deleting achievement:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to delete achievement', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async getAchievementById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const { achievementId } = req.params;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      if (!achievementId) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Achievement ID is required', 'BAD_REQUEST')
        );
        return;
      }

      const achievement = await this.achievementService.getAchievementById(userId, achievementId);
      
      if (!achievement) {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('Achievement not found', 'NOT_FOUND')
        );
        return;
      }

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(achievement, 'Achievement retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting achievement by ID:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to get achievement', 'INTERNAL_SERVER_ERROR')
      );
    }
  }
}