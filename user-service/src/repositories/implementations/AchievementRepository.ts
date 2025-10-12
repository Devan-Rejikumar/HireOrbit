import { injectable } from 'inversify';
import { IAchievementRepository } from '../interfaces/IAchievementRepository';
import { Achievement } from '../../types/achievement';
import { prisma } from '../../prisma/client';
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
    console.log('ACHIEVEMENT-REPO Finding profile for user:', userId);
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    console.log('ACHIEVEMENT-REPO Profile found, achievements:', profile.achievements);

    const achievements = profile.achievements && typeof profile.achievements === 'string'
      ? JSON.parse(profile.achievements) as Achievement[]
      : [];
    const filteredAchievements = achievements.filter(achievement => {
      const shouldKeep = achievement.id !== achievementId;
      return shouldKeep;
    });

    await prisma.userProfile.update({
      where: { userId },
      data: { achievements: JSON.stringify(filteredAchievements) }
    });
  }

  async getAchievementById(userId: string, achievementId: string): Promise<Achievement | null> {  
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return null;
    }


    const achievements = profile.achievements && typeof profile.achievements === 'string'
      ? JSON.parse(profile.achievements) as Achievement[]
      : [];
    
    const foundAchievement = achievements.find(achievement => {
      return achievement.id === achievementId;
    });  
    return foundAchievement || null;
  }
}