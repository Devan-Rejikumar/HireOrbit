import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { IAdminRepository } from '../../repositories/interfaces/IAdminRepository';
import { ICompanyApiRepository } from '../../repositories/implementations/CompanyApiRepository';
import { IJobApiRepository } from '../../repositories/implementations/JobApiRepository';
import { IApplicationApiRepository } from '../../repositories/implementations/ApplicationApiRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAdminService } from '../interfaces/IAdminService';
import { IUserService } from '../interfaces/IUserService';
import { Company, CompanyApprovalResponse } from '../../types/company';
import { UserResponse } from '../../dto/responses/user.response';
import { mapUserToResponse } from '../../dto/mappers/user.mapper';
import { AdminTokenPayload } from '../../types/auth';
import { UserType } from '../../enums/UserType';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../../constants/TimeConstants';
import { DashboardStatisticsResponse, TimeFilter } from '../../types/admin';

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.ICompanyApiRepository) private _companyApiRepository: ICompanyApiRepository,
    @inject(TYPES.IJobApiRepository) private _jobApiRepository: IJobApiRepository,
    @inject(TYPES.IApplicationApiRepository) private _applicationApiRepository: IApplicationApiRepository
  ) {}

  async login(email: string, password: string): Promise<{ 
    admin: UserResponse; 
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
      userType: UserType.ADMIN
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return {
      admin: mapUserToResponse(admin),
      tokens: { accessToken, refreshToken }
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as AdminTokenPayload;
      
      const tokenPayload: AdminTokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        userType: decoded.userType
      };

      const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
      
      return { accessToken: newAccessToken };
    } catch {
      throw new Error('Invalid admin refresh token');
    }
  }

  async logoutWithToken(refreshToken: string): Promise<void> {
    try {
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as AdminTokenPayload;
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async getAllUsers(): Promise<UserResponse[]> {
    return this._userService.getAllUsers();
  }

  async getAllUsersWithPagination(page: number = 1, limit: number = 10): Promise<{ data: UserResponse[]; total: number; page: number; totalPages: number }> {
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

  async getDashboardStatistics(timeFilter: TimeFilter): Promise<DashboardStatisticsResponse> {
    try {
      console.log('[AdminService] Starting getDashboardStatistics with timeFilter:', timeFilter);
      // Calculate date range based on time filter
      // Use UTC dates to ensure consistent date ranges regardless of server timezone
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const day = now.getUTCDate();
      
      // End date: calculate based on filter
      let endDate: Date;
      let startDate: Date;
      
      if (timeFilter === 'week') {
        // Last 7 days (including today) - go back 6 days from today
        const startDay = day - 6;
        startDate = new Date(Date.UTC(year, month, startDay, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      } else if (timeFilter === 'month') {
        // For month filter, show all 12 months of the current year
        // Start from January 1st of current year (UTC)
        startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        // End date: end of current year (December 31st) in UTC
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      } else { // year
        // For year filter, show all years from the first registration to current year
        // Start from a very early date (e.g., 2020) to current year
        startDate = new Date(Date.UTC(2020, 0, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      }
      
      // Log the calculated dates for debugging
      console.log('[AdminService] Date range calculated:', {
        timeFilter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateLocal: startDate.toLocaleString(),
        endDateLocal: endDate.toLocaleString(),
        startDateUTC: new Date(startDate.toISOString()).toISOString(),
        endDateUTC: new Date(endDate.toISOString()).toISOString()
      });
      
      // Ensure dates are properly formatted for API calls (ISO strings)
      // The dates will be converted back to Date objects on the receiving end

      // Determine groupBy based on time filter
      let groupBy: 'day' | 'week' | 'month' | 'year' = 'day';
      if (timeFilter === 'week') {
        groupBy = 'day'; // Show daily data for week view
      } else if (timeFilter === 'month') {
        groupBy = 'month'; // Show monthly data for month view (all 12 months of the year)
      } else if (timeFilter === 'year') {
        groupBy = 'year'; // Show yearly data for year view
      }

      const results = await Promise.allSettled([
        this._adminRepository.getTotalUserCount().catch((err) => {
          console.error('[AdminService] Error fetching total user count:', err);
          return 0;
        }),
        this._companyApiRepository.getTotalCompanyCount().catch((err) => {
          console.error('[AdminService] Error fetching total company count:', err);
          return 0;
        }),
        this._jobApiRepository.getTotalJobCount().catch((err) => {
          console.error('[AdminService] Error fetching total job count:', err);
          return 0;
        }),
        this._adminRepository.getUserStatisticsByTimePeriod(startDate, endDate, groupBy).catch((err) => {
          console.error('[AdminService] Error fetching user statistics:', err);
          return [];
        }),
        this._companyApiRepository.getCompanyStatisticsByTimePeriod(startDate, endDate, groupBy).catch((err) => {
          console.error('[AdminService] Error fetching company statistics:', err);
          return [];
        }),
        this._jobApiRepository.getJobStatisticsByTimePeriod(startDate, endDate, groupBy).catch((err) => {
          console.error('[AdminService] Error fetching job statistics:', err);
          return [];
        }),
        this._jobApiRepository.getTopCompaniesByJobCount(5).catch((err) => {
          console.error('[AdminService] Error fetching top companies:', err);
          return [];
        }),
        this._applicationApiRepository.getTopApplicantsByApplicationCount(5).catch((err) => {
          console.error('[AdminService] Error fetching top applicants:', err);
          return [];
        }),
        this._applicationApiRepository.getTopJobsByApplicationCount(5).catch((err) => {
          console.error('[AdminService] Error fetching top jobs:', err);
          return [];
        })
      ]);

     
      const totalUsers = results[0].status === 'fulfilled' ? results[0].value : 0;
      const totalCompanies = results[1].status === 'fulfilled' ? results[1].value : 0;
      const totalJobs = results[2].status === 'fulfilled' ? results[2].value : 0;
      const userRegistrations = results[3].status === 'fulfilled' ? results[3].value : [];
      const companyRegistrations = results[4].status === 'fulfilled' ? results[4].value : [];
      const jobPostings = results[5].status === 'fulfilled' ? results[5].value : [];
      
      
      console.log('[AdminService] Company registrations received:', {
        count: companyRegistrations.length,
        data: companyRegistrations,
        hasData: companyRegistrations.some(item => item.count > 0)
      });
      console.log('[AdminService] User registrations received:', {
        count: userRegistrations.length,
        data: userRegistrations,
        hasData: userRegistrations.some(item => item.count > 0)
      });
      const topCompanies = results[6].status === 'fulfilled' ? results[6].value : [];
      const topApplicants = results[7].status === 'fulfilled' ? results[7].value : [];
      const topJobs = results[8].status === 'fulfilled' ? results[8].value : [];

   
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const serviceNames = ['User Count', 'Company Count', 'Job Count', 'User Stats', 'Company Stats', 'Job Stats', 'Top Companies', 'Top Applicants', 'Top Jobs'];
          console.error(`[AdminService] Failed to fetch ${serviceNames[index]}:`, result.reason);
        }
      });


      console.log(`[AdminService] Top Companies: ${topCompanies.length} companies found`, topCompanies);
      console.log(`[AdminService] Top Applicants: ${topApplicants.length} applicants found`, topApplicants);
      console.log(`[AdminService] Top Jobs: ${topJobs.length} jobs found`, topJobs);

      // For now, set applications to 0 (can be enhanced later with application service)
      const totalApplications = 0;
      const applicationSubmissions: { date: string; count: number }[] = [];

      // Return statistics even if some services failed (graceful degradation)
      const response = {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        userRegistrations,
        companyRegistrations,
        jobPostings,
        applicationSubmissions,
        topCompanies,
        topApplicants,
        topJobs,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };

      console.log('[AdminService] Successfully compiled statistics response');
      return response;
    } catch (error: unknown) {
      console.error('[AdminService] Unexpected error in getDashboardStatistics:', error);
      // Return default values so the dashboard can still load
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      return {
        totalUsers: 0,
        totalCompanies: 0,
        totalJobs: 0,
        totalApplications: 0,
        userRegistrations: [],
        companyRegistrations: [],
        jobPostings: [],
        applicationSubmissions: [],
        topCompanies: [],
        topApplicants: [],
        topJobs: [],
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    }
  }
}