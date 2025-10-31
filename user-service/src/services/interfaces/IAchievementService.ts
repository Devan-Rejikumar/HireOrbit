import { Achievement, CreateAchievementRequest, UpdateAchievementRequest } from '../../types/achievement';

export interface IAchievementService {
  addAchievement(userId: string, achievementData: CreateAchievementRequest): Promise<Achievement>;
  getAchievements(userId: string): Promise<Achievement[]>;
  updateAchievement(userId: string, achievementId: string, updates: UpdateAchievementRequest): Promise<Achievement>;
  deleteAchievement(userId: string, achievementId: string): Promise<void>;
  getAchievementById(userId: string, achievementId: string): Promise<Achievement | null>;
}
