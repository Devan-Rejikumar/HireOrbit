import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../config/types';
import { ICompanyService } from '../services/interfaces/ICompanyService';
import { HttpStatusCode, CompanyStatusCode } from '../enums/StatusCodes';
import { RejectCompanySchema } from '../dto/schemas/company.schema';
import { buildSuccessResponse } from 'shared-dto';
import { AppError } from '../utils/errors/AppError';
import { getAdminIdFromRequest } from '../utils/requestHelpers';
import { Messages } from '../constants/Messages';

@injectable()
export class CompanyAdminController {
  constructor(
    @inject(TYPES.ICompanyService) private _companyService: ICompanyService
  ) {}

  async getAllCompanies(req: Request, res: Response): Promise<void> {
    const companies = await this._companyService.getAllCompanies();
    res.status(CompanyStatusCode.COMPANIES_RETRIEVED).json(
      buildSuccessResponse({ companies }, Messages.COMPANY.COMPANIES_RETRIEVED_SUCCESS)
    );
  }

  async blockCompany(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      throw new AppError(Messages.COMPANY.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    await this._companyService.blockCompany(id);
    res.status(CompanyStatusCode.COMPANY_BLOCKED).json(
      buildSuccessResponse(null, Messages.COMPANY.BLOCKED_SUCCESS)
    );
  }

  async unblockCompany(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      throw new AppError(Messages.COMPANY.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    await this._companyService.unblockCompany(id);
    res.status(CompanyStatusCode.COMPANY_UNBLOCKED).json(
      buildSuccessResponse(null, Messages.COMPANY.UNBLOCKED_SUCCESS)
    );
  }

  async getPendingCompanies(req: Request, res: Response): Promise<void> {
    const companies = await this._companyService.getPendingCompanies();
    res.status(CompanyStatusCode.PENDING_COMPANIES_RETRIEVED).json(
      buildSuccessResponse({ companies }, Messages.COMPANY.PENDING_COMPANIES_RETRIEVED_SUCCESS)
    );
  }

  async approveCompany(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const { id: companyId } = req.params;
    if (!companyId) {
      throw new AppError(Messages.COMPANY.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const company = await this._companyService.approveCompany(companyId, adminId);
    res.status(CompanyStatusCode.COMPANY_APPROVED).json(
      buildSuccessResponse(
        { company, message: Messages.COMPANY.APPROVED_SUCCESS },
        Messages.COMPANY.APPROVED_SUCCESS
      )
    );
  }

  async rejectCompany(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const validationResult = RejectCompanySchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { id: companyId } = req.params;
    const { reason } = validationResult.data;
    
    const company = await this._companyService.rejectCompany(companyId, reason, adminId);
    res.status(CompanyStatusCode.COMPANY_REJECTED).json(
      buildSuccessResponse({ company }, Messages.COMPANY.REJECTED_SUCCESS)
    );
  }

  async getAllCompaniesForAdmin(req: Request, res: Response): Promise<void> {
    const companies = await this._companyService.getAllCompaniesForAdmin();
    res.status(CompanyStatusCode.COMPANIES_RETRIEVED).json(
      buildSuccessResponse({ companies }, Messages.COMPANY.COMPANIES_RETRIEVED_SUCCESS)
    );
  }

  async getCompanyDetailsForAdmin(req: Request, res: Response): Promise<void> {
    const adminId = getAdminIdFromRequest(req, res);
    if (!adminId) return;

    const { id: companyId } = req.params;
    if (!companyId) {
      throw new AppError(Messages.COMPANY.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const company = await this._companyService.getCompanyDetailsForAdmin(companyId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ company }, Messages.COMPANY.DETAILS_RETRIEVED_SUCCESS)
    );
  }

  async searchCompanyByName(req: Request, res: Response): Promise<void> {
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
      throw new AppError(Messages.COMPANY.NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const company = await this._companyService.searchCompanyByName(name);
    
    if (!company) {
      throw new AppError(Messages.COMPANY.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    
    const publicProfile = {
      id: company.id,
      name: company.companyName,
      industry: company.industry,
      companySize: company.size,
      website: company.website,
      description: company.description,
      logo: company.logo,
      foundedYear: company.foundedYear?.toString(),
      location: company.headquarters,
      email: company.contactPersonEmail,
      phone: company.phone,
      socialMedia: {
        linkedin: company.linkedinUrl
      }
    };

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ company: publicProfile }, Messages.COMPANY.PROFILE_RETRIEVED_SUCCESS)
    );
  }

  async getTotalCompanyCount(req: Request, res: Response): Promise<void> {
    const total = await this._companyService.getTotalCompanyCount();
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ total }, 'Total company count retrieved successfully')
    );
  }

  async getCompanyStatisticsByTimePeriod(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, groupBy } = req.query;
    
    if (!startDate || !endDate || !groupBy) {
      throw new AppError('startDate, endDate, and groupBy are required', HttpStatusCode.BAD_REQUEST);
    }

    if (!['day', 'week', 'month', 'year'].includes(groupBy as string)) {
      throw new AppError('groupBy must be day, week, month, or year', HttpStatusCode.BAD_REQUEST);
    }
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    console.log('[CompanyAdminController] Received date range:', {
      startDate: startDate,
      endDate: endDate,
      startParsed: start.toISOString(),
      endParsed: end.toISOString(),
      startLocal: start.toLocaleString(),
      endLocal: end.toLocaleString(),
      groupBy
    });
    
    const statistics = await this._companyService.getCompanyStatisticsByTimePeriod(
      start, 
      end, 
      groupBy as 'day' | 'week' | 'month' | 'year'
    );
    
    console.log('[CompanyAdminController] Returning statistics:', {
      count: statistics.length,
      statistics: statistics.slice(0, 5) 
    });

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ statistics }, 'Company statistics retrieved successfully')
    );
  }
}

