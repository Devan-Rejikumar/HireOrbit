import { injectable } from 'inversify';
import { prisma } from '../prisma/client';
import { User, Otp } from '@prisma/client';
import { IUserRepository } from './IUserRepository';
import { BaseRepository } from './BaseRepository';
import { PaginationResult } from '../interfaces/IBaseRepository';
import { ProfileData, UserProfile } from '../types/profile';

@injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected getModel(){
    return prisma.user;
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({email});
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    profilePicture?: string;
    isGoogleUser?: boolean;
  }): Promise<User> {
    const user = await this.create({
    
      email: data.email,
      password: data.password,
      name: data.name, 
      role: 'jobseeker', 
      isVerified: data.isGoogleUser || false, 
      
    });

   
    if (data.profilePicture) {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          profilePicture: data.profilePicture,
        },
      });
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async saveOTP(email: string, otp: number): Promise<Otp> {
    return prisma.otp.create({
      data: {
        email,
        otp,
      },
    });
  }

  async findOTP(email: string): Promise<Otp | null> {
    return prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteOTP(email: string): Promise<void> {
    await prisma.otp.deleteMany({
      where: { email },
    });
  }
  async getAllUsers(page: number = 1, limit: number = 10) {
    return this.findWithPagination(page, limit, {role:'jobseeker'});
  }
 
  async blockUser(id: string): Promise<User> {
    return this.update(id, {isBlocked:true});
  }

  async unblockUser(id: string): Promise<User> {
    return this.update(id, {isBlocked:false});
  }

  async savePasswordResetOTP(
    email: string,
    role: string,
    otp: string,
    expiresAt: Date
  ) {
    await prisma.passwordReset.deleteMany({ where: { email, role } });
    return prisma.passwordReset.create({
      data: { email, role, otp, expiresAt },
    });
  }

  async findPasswordResetOTP(email: string, otp: string){
    return prisma.passwordReset.findFirst({
      where: { email, otp },
    });
  }

  async deletePasswordResetOTP(email: string, otp: string) {
    await prisma.passwordReset.deleteMany({ where: { email, otp } });
  }
  async updateUserPassword(
    email: string,
    hashedPassword: string
  ): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  async updateUserName(userId: string, name: string): Promise<User> {
    console.log(' UserRepository: updateUserName called with userId:', userId, 'name:', name);
    
    const result = await prisma.user.update({
      where: { id: userId },
      data: { name }
    });
    
    console.log('UserRepository: updateUserName result:', JSON.stringify(result, null, 2));
    return result;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.update(id, data);
  }
  async updateProfile(userId: string, profileData: ProfileData): Promise<UserProfile> {
    try {
      console.log('UserRepository: updateProfile called with userId =', userId);
      console.log('UserRepository: profileData =', profileData);
    
   
      const prismaData = {
        headline: profileData.headline ?? null,
        about: profileData.about ?? null,
        location: profileData.location ?? null,
        phone: profileData.phone ?? null,
        profilePicture: profileData.profilePicture ?? null,
      };
    
      const updatedProfile = await prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...prismaData,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...prismaData,
          skills: [], 
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    
      console.log(' UserRepository: updatedProfile =', updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('UserRepository: Error in updateProfile:', error);
      throw error;
    }
  }
}
