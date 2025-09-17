import { Achievement } from '../types/achievement';

export interface IAchievementRepository {
  addAchievement(userId: string, achievement: Omit<Achievement, 'id'>): Promise<Achievement>;
  getAchievements(userId: string): Promise<Achievement[]>;
  updateAchievement(userId: string, achievementId: string, updates: Partial<Achievement>): Promise<Achievement>;
  deleteAchievement(userId: string, achievementId: string): Promise<void>;
  getAchievementById(userId: string, achievementId: string): Promise<Achievement | null>;
}