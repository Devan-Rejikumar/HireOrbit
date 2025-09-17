import { injectable, inject } from 'inversify';
import { IAchievementService } from './IAchievementService';
import { IAchievementRepository } from '../repositories/IAchievementRepository';
import { Achievement, CreateAchievementRequest, UpdateAchievementRequest } from '../types/achievement';
import { CreateAchievementSchema, UpdateAchievementSchema } from '../dto/schemas/achievement.schema';

@injectable()
export class AchievementService implements IAchievementService {
  constructor(
    @inject('IAchievementRepository') private achievementRepository: IAchievementRepository
  ) {}

  private validateAndCleanAchievementData(data: CreateAchievementRequest): CreateAchievementRequest {
    return CreateAchievementSchema.parse(data);
  }

  private async checkDuplicateAchievement(userId: string, data: CreateAchievementRequest): Promise<void> {
    const existingAchievements = await this.achievementRepository.getAchievements(userId);
    
    const isDuplicate = existingAchievements.some(achievement => 
      achievement.title.toLowerCase() === data.title.toLowerCase() &&
      achievement.date === data.date &&
      achievement.category.toLowerCase() === data.category.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('This achievement already exists');
    }
  }

  async addAchievement(userId: string, achievementData: CreateAchievementRequest): Promise<Achievement> {
    const validatedData = this.validateAndCleanAchievementData(achievementData);
    await this.checkDuplicateAchievement(userId, validatedData);
    return this.achievementRepository.addAchievement(userId, validatedData);
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const achievements = await this.achievementRepository.getAchievements(userId);
    return achievements.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async updateAchievement(userId: string, achievementId: string, updates: UpdateAchievementRequest): Promise<Achievement> {
    const existingAchievement = await this.achievementRepository.getAchievementById(userId, achievementId);
    if (!existingAchievement) {
      throw new Error('Achievement not found');
    }

    console.log('🔍 [ACHIEVEMENT-SERVICE] Validating updates:', JSON.stringify(updates, null, 2));
    const validatedUpdates = UpdateAchievementSchema.parse(updates);
    console.log('🔍 [ACHIEVEMENT-SERVICE] Validated updates:', JSON.stringify(validatedUpdates, null, 2));

    if (validatedUpdates.title || validatedUpdates.date || validatedUpdates.category) {
      const existingAchievements = await this.achievementRepository.getAchievements(userId);
      const otherAchievements = existingAchievements.filter(achievement => achievement.id !== achievementId);
      
      const isDuplicate = otherAchievements.some(achievement => 
        achievement.title.toLowerCase() === (validatedUpdates.title || existingAchievement.title).toLowerCase() &&
        achievement.date === (validatedUpdates.date || existingAchievement.date) &&
        achievement.category.toLowerCase() === (validatedUpdates.category || existingAchievement.category).toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('This achievement already exists');
      }
    }

    return this.achievementRepository.updateAchievement(userId, achievementId, validatedUpdates);
  }

  async deleteAchievement(userId: string, achievementId: string): Promise<void> {
    console.log('🔍 [ACHIEVEMENT-SERVICE] Looking for achievement:', achievementId, 'for user:', userId);
    
    const existingAchievement = await this.achievementRepository.getAchievementById(userId, achievementId);
    console.log('🔍 [ACHIEVEMENT-SERVICE] Found achievement:', existingAchievement);
    
    if (!existingAchievement) {
      throw new Error('Achievement not found');
    }

    console.log('🗑️ [ACHIEVEMENT-SERVICE] Deleting achievement...');
    return this.achievementRepository.deleteAchievement(userId, achievementId);
  }

  async getAchievementById(userId: string, achievementId: string): Promise<Achievement | null> {
    return this.achievementRepository.getAchievementById(userId, achievementId);
  }
}
