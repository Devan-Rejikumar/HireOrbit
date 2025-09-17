import { injectable } from 'inversify';
import { IAchievementRepository } from './IAchievementRepository';
import { Achievement } from '../types/achievement';
import { prisma } from '../prisma/client';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class AchievementRepository implements IAchievementRepository {
  async addAchievement(userId: string, achievement: Omit<Achievement, 'id'>): Promise<Achievement> {
    const newAchievement = {
      id: uuidv4(),
      ...achievement
    };

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    const currentAchievements = profile.achievements && typeof profile.achievements === 'string'
      ? JSON.parse(profile.achievements) as Achievement[]
      : [];
    
    const updatedAchievements = [...currentAchievements, newAchievement];

    await prisma.userProfile.update({
      where: { userId },
      data: { achievements: JSON.stringify(updatedAchievements) }
    });

    return newAchievement;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { achievements: true }
    });

    if (!profile?.achievements || typeof profile.achievements !== 'string') {
      return [];
    }

    return JSON.parse(profile.achievements) as Achievement[];
  }

  async updateAchievement(userId: string, achievementId: string, updates: Partial<Achievement>): Promise<Achievement> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    const achievements = profile.achievements && typeof profile.achievements === 'string'
      ? JSON.parse(profile.achievements) as Achievement[]
      : [];
    
    const achievementIndex = achievements.findIndex(achievement => achievement.id === achievementId);

    if (achievementIndex === -1) {
      throw new Error('Achievement not found');
    }

    achievements[achievementIndex] = { ...achievements[achievementIndex], ...updates };
    const updatedAchievement = achievements[achievementIndex];

    await prisma.userProfile.update({
      where: { userId },
      data: { achievements: JSON.stringify(achievements) }
    });

    return updatedAchievement;
  }

  async deleteAchievement(userId: string, achievementId: string): Promise<void> {
    console.log('🔍 [ACHIEVEMENT-REPO] Finding profile for user:', userId);
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    console.log('🔍 [ACHIEVEMENT-REPO] Profile found, achievements:', profile.achievements);

    const achievements = profile.achievements && typeof profile.achievements === 'string'
      ? JSON.parse(profile.achievements) as Achievement[]
      : [];
    
    console.log('🔍 [ACHIEVEMENT-REPO] Parsed achievements:', achievements);
    console.log('🔍 [ACHIEVEMENT-REPO] Looking for achievement ID:', achievementId);
    
    console.log('🔍 [ACHIEVEMENT-REPO] Filtering out achievement ID:', achievementId, 'Type:', typeof achievementId);
    console.log('🔍 [ACHIEVEMENT-REPO] Available achievement IDs for filtering:', achievements.map(a => ({ id: a.id, type: typeof a.id })));
    
    const filteredAchievements = achievements.filter(achievement => {
      const shouldKeep = achievement.id !== achievementId;
      console.log('🔍 [ACHIEVEMENT-REPO] Filter check:', achievement.id, '!==', achievementId, 'Keep:', shouldKeep);
      return shouldKeep;
    });
    console.log('🔍 [ACHIEVEMENT-REPO] Filtered achievements:', filteredAchievements);

    await prisma.userProfile.update({
      where: { userId },
      data: { achievements: JSON.stringify(filteredAchievements) }
    });
    
    console.log('✅ [ACHIEVEMENT-REPO] Achievement deleted successfully');
  }

  async getAchievementById(userId: string, achievementId: string): Promise<Achievement | null> {
    console.log('🔍 [ACHIEVEMENT-REPO] getAchievementById - User ID:', userId, 'Achievement ID:', achievementId);
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      console.log('❌ [ACHIEVEMENT-REPO] Profile not found');
      return null;
    }

    console.log('🔍 [ACHIEVEMENT-REPO] Profile found, achievements:', profile.achievements);

    const achievements = profile.achievements && typeof profile.achievements === 'string'
      ? JSON.parse(profile.achievements) as Achievement[]
      : [];
    
    console.log('🔍 [ACHIEVEMENT-REPO] Parsed achievements:', achievements);
    
    console.log('🔍 [ACHIEVEMENT-REPO] Looking for achievement ID:', achievementId, 'Type:', typeof achievementId);
    console.log('🔍 [ACHIEVEMENT-REPO] Available achievement IDs:', achievements.map(a => ({ id: a.id, type: typeof a.id })));
    
    const foundAchievement = achievements.find(achievement => {
      console.log('🔍 [ACHIEVEMENT-REPO] Comparing:', achievement.id, '===', achievementId, 'Result:', achievement.id === achievementId);
      return achievement.id === achievementId;
    });
    console.log('🔍 [ACHIEVEMENT-REPO] Found achievement:', foundAchievement);
    
    return foundAchievement || null;
  }
}