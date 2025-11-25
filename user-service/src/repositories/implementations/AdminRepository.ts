import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { User } from '@prisma/client';
import { IAdminRepository } from '../interfaces/IAdminRepository';
import { UserRole } from '../../enums/UserRole';

@injectable()
export class AdminRepository implements IAdminRepository{
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, role: UserRole.ADMIN } });
  }
}