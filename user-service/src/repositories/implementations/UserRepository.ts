import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { User } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { BaseRepository } from './BaseRepository';
import { PaginationResult } from '../../interfaces/IBaseRepository';
import { UserRole } from '../../enums/UserRole';

@injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected _getModel() {
    return prisma.user as unknown as ReturnType<BaseRepository<User>['_getModel']>;
  }

  
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    isGoogleUser?: boolean;
  }): Promise<User> {
    return this.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: UserRole.JOBSEEKER,
      isVerified: data.isGoogleUser || false,
    });
  }

  async findById(id: string): Promise<User | null> {
    return super.findById(id);
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<PaginationResult<User>> {
    return this.findWithPagination(page, limit, { role: UserRole.JOBSEEKER });
  }

  async blockUser(id: string): Promise<User> {
    return this.update(id, { isBlocked: true });
  }


  async unblockUser(id: string): Promise<User> {
    return this.update(id, { isBlocked: false });
  }

  async updateUserPassword(email: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }


  async updateUserName(userId: string, name: string): Promise<User> {
    return this.update(userId, { name });
  }


  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.update(id, data);
  }
}