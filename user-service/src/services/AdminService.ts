import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IAdminRepository } from '../repositories/IAdminRepository';
import { ICompanyApiRepository } from '../repositories/CompanyApiRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { IAdminService } from './IAdminService';
import { IUserService } from './IUserService';
import { Company, CompanyApprovalResponse } from '../types/company';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

interface AdminTokenPayload {
  userId: string;
  email: string;
  role: string;
  userType: string;
  iat?: number;
  exp?: number;
}

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.ICompanyApiRepository) private _companyApiRepository: ICompanyApiRepository
  ) {}

  async login(email: string, password: string): Promise<{ 
    admin: User; 
    tokens: { accessToken: string; refreshToken: string } 
  }> {
    const admin = await this._adminRepository.findByEmail(email);
    if (!admin) throw new Error('Invalid credentials');
    
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new Error('Invalid credentials');
    
    if (admin.isBlocked) throw new Error('Account blocked');

    const tokenPayload: AdminTokenPayload = {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      userType: 'admin'
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '2h' });
    const refreshToken = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return {
      admin,
      tokens: { accessToken, refreshToken }
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as AdminTokenPayload;
      
      const tokenPayload: AdminTokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        userType: decoded.userType
      };

      const newAccessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '2h' });
      
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid admin refresh token');
    }
  }

  async logoutWithToken(refreshToken: string): Promise<void> {
    try {
      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as AdminTokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this._userService.getAllUsers();
  }

  async getAllUsersWithPagination(page: number = 1, limit: number = 10): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    return this._userService.getAllUsersWithPagination(page, limit);
  }

  async getPendingCompanies(): Promise<Company[]> {
    return this._companyApiRepository.getPendingCompanies();
  }

  async approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse> {
    return this._companyApiRepository.approveCompany(companyId, adminId);
  }

  async rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse> {
    return this._companyApiRepository.rejectCompany(companyId, reason, adminId);
  }
}

