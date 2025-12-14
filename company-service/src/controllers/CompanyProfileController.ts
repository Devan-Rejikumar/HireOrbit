import { Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../config/types';
import { ICompanyService } from '../services/interfaces/ICompanyService';
import { HttpStatusCode, CompanyStatusCode } from '../enums/StatusCodes';
import { CompanyProfileSchema, CompanyStep2Schema, CompanyStep3Schema } from '../dto/schemas/company.schema';
import { buildSuccessResponse } from 'shared-dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../utils/errors/AppError';
import { getCompanyIdFromRequest } from '../utils/requestHelpers';
import { Messages } from '../constants/Messages';
import cloudinary, { configureCloudinary } from '../config/cloudinary';

@injectable()
export class CompanyProfileController {
  constructor(
    @inject(TYPES.ICompanyService) private _companyService: ICompanyService,
  ) {}

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;

    const company = await this._companyService.getCompanyProfile(companyId);
    
    if (!company) {
      throw new AppError(Messages.COMPANY.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(
        { id: company.id, companyName: company.companyName, email: company.email },
        Messages.COMPANY.PROFILE_RETRIEVED_SUCCESS,
      ),
    );
  }

  async getCompanyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;

    const company = await this._companyService.getCompanyProfile(companyId);
    const profileStep = await this._companyService.getProfileStep(companyId);
    
    res.status(CompanyStatusCode.PROFILE_RETRIEVED).json(
      buildSuccessResponse({ company, profileStep }, Messages.COMPANY.PROFILE_RETRIEVED_SUCCESS),
    );
  }

  async updateCompanyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;
    
    const validatedData = CompanyProfileSchema.parse(req.body);
    
    // Handle logo upload to Cloudinary if provided
    if (validatedData.logo && typeof validatedData.logo === 'string' && validatedData.logo.startsWith('data:image/')) {
      console.log('[CompanyProfileController] Processing logo upload to Cloudinary...');
      try {
        // Ensure Cloudinary is configured
        if (!configureCloudinary()) {
          console.error('[CompanyProfileController] Cloudinary configuration missing');
          throw new AppError('Cloudinary configuration is missing. Please check environment variables.', HttpStatusCode.INTERNAL_SERVER_ERROR);
        }

        const result = await cloudinary.uploader.upload(validatedData.logo, {
          folder: 'company-logos',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' }
          ],
          resource_type: 'image'
        });
        
        if (!result || !result.secure_url) {
          console.error('[CompanyProfileController] Cloudinary upload returned invalid result:', result);
          throw new AppError('Invalid response from Cloudinary', HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
        
        validatedData.logo = result.secure_url;
        console.log('[CompanyProfileController] Cloudinary upload successful:', result.secure_url);
      } catch (cloudinaryError: unknown) {
        console.error('[CompanyProfileController] Cloudinary upload error:', cloudinaryError);
        const errorMessage = cloudinaryError instanceof Error 
          ? cloudinaryError.message 
          : typeof cloudinaryError === 'object' && cloudinaryError !== null && 'message' in cloudinaryError
            ? String(cloudinaryError.message)
            : 'Failed to upload company logo';
        throw new AppError(errorMessage, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
    
    const updateCompany = await this._companyService.updateCompanyProfile(companyId, validatedData);
    
    res.status(CompanyStatusCode.COMPANY_PROFILE_UPDATED).json(
      buildSuccessResponse({ company: updateCompany }, Messages.COMPANY.PROFILE_UPDATED_SUCCESS),
    );
  }

  async getProfileStep(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;
    
    const company = await this._companyService.getCompanyProfile(companyId);
    
    if (company?.isVerified) {
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ profileStep: 'approved' }, Messages.COMPANY.IS_APPROVED),
      );
      return;
    }
    
    if (company?.rejectionReason) {
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ profileStep: 'rejected' }, Messages.COMPANY.IS_REJECTED),
      );
      return;
    }
    
    const profileStep = await this._companyService.getProfileStep(companyId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ profileStep }, Messages.COMPANY.PROFILE_STEP_RETRIEVED_SUCCESS),
    );
  }

  async completeStep2(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;

    const validationResult = CompanyStep2Schema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const step2Data = validationResult.data;
    const company = await this._companyService.completeStep2(companyId, step2Data);
    
    res.status(CompanyStatusCode.STEP2_COMPLETED).json(
      buildSuccessResponse({ company }, Messages.COMPANY.STEP2_COMPLETED_SUCCESS),
    );
  }

  async completeStep3(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;

    const validationResult = CompanyStep3Schema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const step3Data = validationResult.data;
    const company = await this._companyService.completeStep3(companyId, step3Data);

    res.status(CompanyStatusCode.STEP3_COMPLETED).json(
      buildSuccessResponse(
        { company, message: Messages.COMPANY.PROFILE_SUBMITTED_FOR_REVIEW },
        Messages.COMPANY.STEP3_COMPLETED_SUCCESS,
      ),
    );
  }

  async reapplyCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;

    const result = await this._companyService.reapplyCompany(companyId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.COMPANY.REAPPLY_SUCCESS),
    );
  }

  async getReapplyStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;

    const status = await this._companyService.getReapplyStatus(companyId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(status, Messages.COMPANY.REAPPLY_STATUS_RETRIEVED_SUCCESS),
    );
  }

  async getCompanyJobCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = getCompanyIdFromRequest(req, res);
    if (!companyId) return;
    
    const jobCount = await this._companyService.getCompanyJobCount(companyId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ count: jobCount }, Messages.COMPANY.JOB_COUNT_RETRIEVED_SUCCESS),
    );
  }
}
