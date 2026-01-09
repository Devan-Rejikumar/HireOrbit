import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IAdminService } from '../services/interfaces/IAdminService';
import { IUserService } from '../services/interfaces/IUserService';
import { CookieService } from '../services/implementations/CookieService';
import { Messages } from '../constants/Messages';
import { HttpStatusCode, AuthStatusCode } from '../enums/StatusCodes';
import { getAdminIdFromRequest } from '../utils/requestHelpers';
import { RequestWithUser } from '../types/express/RequestWithUser';
import { AppError } from '../utils/errors/AppError';


@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.IAdminService) private _adminService: IAdminService,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.CookieService) private _cookieService: CookieService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(Messages.VALIDATION.EMAIL_AND_PASSWORD_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const { admin, tokens } = await this._adminService.login(email, password);
    
    this._cookieService.setAccessToken(res, tokens.accessToken);
    this._cookieService.setRefreshToken(res, tokens.refreshToken);
    res.status(AuthStatusCode.LOGIN_SUCCESS).json({ admin });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new AppError(Messages.AUTH.ADMIN_REFRESH_TOKEN_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const result = await this._adminService.refreshToken(refreshToken);
    
    this._cookieService.setAccessToken(res, result.accessToken);

    res.status(HttpStatusCode.OK).json({ 
      message: Messages.AUTH.ADMIN_TOKEN_REFRESH_SUCCESS 
    });
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this._adminService.getAllUsersWithPagination(page, limit);
    res.status(HttpStatusCode.OK).json({ 
      users: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalUsers: result.total,
        pageSize: limit
      }
    });
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const { id } = req.params;

    if (!id) {
      throw new AppError(Messages.USER.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const user = await this._userService.blockUser(id);
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.USER.BLOCKED_SUCCESS, 
      user 
    });
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const { id } = req.params;

    if (!id) {
      throw new AppError(Messages.USER.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const user = await this._userService.unblockUser(id);
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.USER.UNBLOCKED_SUCCESS, 
      user 
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken){
      await this._adminService.logoutWithToken(refreshToken);
    }
    this._cookieService.clearAccessToken(res);
    this._cookieService.clearRefreshToken(res);
  
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.AUTH.ADMIN_LOGOUT_SUCCESS 
    });
  }

  async me(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const reqWithUser = req as RequestWithUser;
    const admin = {
      id: adminId,
      email: reqWithUser.user?.email || '',
      role: reqWithUser.user?.role || 'admin'
    };

    res.status(HttpStatusCode.OK).json({ admin });
  }

  async getPendingCompanies(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const companies = await this._adminService.getPendingCompanies();
    res.status(HttpStatusCode.OK).json({ companies });
  }

  async approveCompany(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const { id: companyId } = req.params;

    if (!companyId) {
      throw new AppError(Messages.COMPANY.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const result = await this._adminService.approveCompany(companyId, adminId);
    res.status(HttpStatusCode.OK).json({
      message: Messages.COMPANY.APPROVED_SUCCESS,
      result
    });
  }

  async rejectCompany(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const { id: companyId } = req.params;
    const { reason } = req.body;

    if (!companyId) {
      throw new AppError(Messages.COMPANY.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    if (!reason || !reason.trim()) {
      throw new AppError(Messages.COMPANY.REJECTION_REASON_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    if (reason.trim().length < 10) {
      throw new AppError(Messages.COMPANY.REJECTION_REASON_MIN_LENGTH, HttpStatusCode.BAD_REQUEST);
    }

    const result = await this._adminService.rejectCompany(companyId, reason.trim(), adminId);
    res.status(HttpStatusCode.OK).json({
      message: Messages.COMPANY.REJECTED_SUCCESS,
      result
    });
  }

  async getDashboardStatistics(req: Request, res: Response): Promise<void> {
    try {
      const adminId = getAdminIdFromRequest(req, res);
      if (!adminId) return;

      const timeFilter = (req.query.timeFilter as 'week' | 'month' | 'year') || 'month';
      
      if (!['week', 'month', 'year'].includes(timeFilter)) {
        throw new AppError('Invalid time filter. Must be week, month, or year', HttpStatusCode.BAD_REQUEST);
      }
      const statistics = await this._adminService.getDashboardStatistics(timeFilter);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: statistics
      });
    } catch (_error: unknown) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
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
        }
      });
    }
  }
}