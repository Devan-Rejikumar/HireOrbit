import { injectable, inject } from 'inversify';
import { IOfferService } from '../interfaces/IOfferService';
import { IOfferRepository } from '../../repositories/interfaces/IOfferRepository';
import { IApplicationRepository } from '../../repositories/interfaces/IApplicationRepository';
import { IOfferPdfService } from '../interfaces/IOfferPdfService';
import { IEventService } from '../interfaces/IEventService';
import { IUserServiceClient } from '../interfaces/IUserServiceClient';
import { IJobServiceClient } from '../interfaces/IJobServiceClient';
import { ICompanyServiceClient } from '../interfaces/ICompanyServiceClient';
import { ICompanyOfferTemplateService } from '../interfaces/ICompanyOfferTemplateService';
import { OfferResponse, OfferDetailsResponse, PaginatedOfferResponse } from '../../dto/responses/offer.response';
import { CreateOfferInput, GetOffersQueryInput } from '../../dto/schemas/offer.schema';
import { OfferStatus } from '../../enums/OfferStatus';
import { ApplicationStatus } from '../../enums/ApplicationStatus';
import { TYPES } from '../../config/types';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors/AppError';
import { Messages } from '../../constants/Messages';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { Events } from '../../constants/Events';

@injectable()
export class OfferService implements IOfferService {
  constructor(
    @inject(TYPES.IOfferRepository) private _offerRepository: IOfferRepository,
    @inject(TYPES.IApplicationRepository) private _applicationRepository: IApplicationRepository,
    @inject(TYPES.IOfferPdfService) private _pdfService: IOfferPdfService,
    @inject(TYPES.IEventService) private _eventService: IEventService,
    @inject(TYPES.IUserServiceClient) private _userServiceClient: IUserServiceClient,
    @inject(TYPES.IJobServiceClient) private _jobServiceClient: IJobServiceClient,
    @inject(TYPES.ICompanyServiceClient) private _companyServiceClient: ICompanyServiceClient,
    @inject(TYPES.ICompanyOfferTemplateService) private _templateService: ICompanyOfferTemplateService,
  ) {}

  async createOffer(applicationId: string, companyId: string, data: CreateOfferInput): Promise<OfferResponse> {
    // 1. Fetch application by ID
    const application = await this._applicationRepository.findById(applicationId);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // 2. Verify application belongs to company
    if (application.companyId !== companyId) {
      throw new AppError(Messages.VALIDATION.UNAUTHORIZED_ACCESS, HttpStatusCode.FORBIDDEN);
    }

    // 3. Verify application status is ACCEPTED (SELECTED)
    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new AppError(Messages.OFFER.APPLICATION_NOT_SELECTED, HttpStatusCode.BAD_REQUEST);
    }

    // 4. Check if offer already exists
    const existingOffer = await this._offerRepository.findByApplicationId(applicationId);
    if (existingOffer) {
      throw new AppError(Messages.OFFER.ALREADY_EXISTS, HttpStatusCode.BAD_REQUEST);
    }

    // 5. Validate date ranges
    const joiningDate = new Date(data.joiningDate);
    const expiryDate = new Date(data.offerExpiryDate);
    const now = new Date();

    if (expiryDate <= joiningDate) {
      throw new AppError(Messages.OFFER.INVALID_DATES, HttpStatusCode.BAD_REQUEST);
    }

    if (expiryDate <= now) {
      throw new AppError(Messages.OFFER.INVALID_DATES, HttpStatusCode.BAD_REQUEST);
    }

    // 6. Create offer record
    const offer = await this._offerRepository.create({
      ...data,
      applicationId,
      userId: application.userId,
      companyId,
    });

    // 7. Generate PDF and upload
    try {
      const userData = await this._userServiceClient.getUserById(application.userId);
      const candidateName = userData.data?.user?.name || userData.data?.user?.username || 'Candidate';

      const jobData = await this._jobServiceClient.getJobById(application.jobId);
      const companyName = jobData.data?.job?.company || jobData.job?.company || 'Company';

      // Fetch company template and logo
      const [template, companyData] = await Promise.all([
        this._templateService.getTemplate(companyId),
        this._companyServiceClient.getCompanyById(companyId),
      ]);
      const companyLogoUrl = companyData.data?.company?.logo || companyData.company?.logo || null;

      const pdfUrl = await this._pdfService.generateAndUploadPdf(offer, candidateName, companyName, template, companyLogoUrl);

      // 8. Update offer with PDF URL
      const updatedOffer = await this._offerRepository.update(offer.id, { pdfUrl });
      
      // 9. Publish Kafka event
      try {
        await this._eventService.publish(Events.OFFER.CREATED, {
          offerId: updatedOffer.id,
          applicationId: updatedOffer.applicationId,
          userId: updatedOffer.userId,
          companyId: updatedOffer.companyId,
          jobTitle: updatedOffer.jobTitle,
          ctc: updatedOffer.ctc,
          joiningDate: updatedOffer.joiningDate.toISOString(),
          offerExpiryDate: updatedOffer.offerExpiryDate.toISOString(),
          pdfUrl: updatedOffer.pdfUrl || undefined,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.warn('Kafka not available, continuing...', error);
      }

      return this.mapToResponse(updatedOffer);
    } catch (error) {
      logger.error('[OfferService] Error generating PDF, but offer created:', error);
      // Offer is created, but PDF generation failed
      // We can retry PDF generation later or handle it gracefully
      throw new AppError(Messages.OFFER.PDF_GENERATION_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserOffers(userId: string, page: number, limit: number, status?: string): Promise<PaginatedOfferResponse> {
    const filters = status ? { status: status as OfferStatus } : undefined;
    const { offers, total } = await this._offerRepository.findByUserId(userId, page, limit, filters);

    // Check for expired offers and mark them
    const now = new Date();
    const processedOffers = offers.map(offer => {
      if (offer.status === OfferStatus.PENDING && offer.offerExpiryDate < now) {
        // Note: In a production system, you might want to update these in the database
        // For now, we just return them with EXPIRED status in the response
        return { ...offer, status: OfferStatus.EXPIRED as OfferStatus };
      }
      return offer;
    });

    const totalPages = Math.ceil(total / limit);
    return {
      offers: processedOffers.map(this.mapToResponse),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getCompanyOffers(companyId: string, filters: GetOffersQueryInput): Promise<PaginatedOfferResponse> {
    const offerFilters = {
      status: filters.status ? (filters.status as OfferStatus) : undefined,
      search: filters.search,
    };

    const { offers, total } = await this._offerRepository.findByCompanyId(
      companyId,
      filters.page,
      filters.limit,
      offerFilters
    );

    const totalPages = Math.ceil(total / filters.limit);
    return {
      offers: offers.map(this.mapToResponse),
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    };
  }

  async getOfferById(offerId: string, userId?: string, companyId?: string): Promise<OfferDetailsResponse> {
    let offer;

    if (userId) {
      offer = await this._offerRepository.findByUserIdAndId(userId, offerId);
      if (!offer) {
        throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }
    } else if (companyId) {
      offer = await this._offerRepository.findByCompanyIdAndId(companyId, offerId);
      if (!offer) {
        throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }
    } else {
      offer = await this._offerRepository.findById(offerId);
      if (!offer) {
        throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }
    }

    // Enrich with external data
    let candidateName: string | undefined;
    let candidateEmail: string | undefined;
    let companyName: string | undefined;

    try {
      const userData = await this._userServiceClient.getUserById(offer.userId);
      candidateName = userData.data?.user?.name || userData.data?.user?.username;
      candidateEmail = userData.data?.user?.email;
    } catch (error) {
      logger.error(`Error fetching user details for offer ${offerId}:`, error);
    }

    try {
      const application = await this._applicationRepository.findById(offer.applicationId);
      if (application) {
        const jobData = await this._jobServiceClient.getJobById(application.jobId);
        companyName = jobData.data?.job?.company || jobData.job?.company;
      }
    } catch (error) {
      logger.error(`Error fetching company details for offer ${offerId}:`, error);
    }

    return {
      ...this.mapToResponse(offer),
      candidateName,
      candidateEmail,
      companyName,
    };
  }

  async acceptOffer(offerId: string, userId: string): Promise<OfferResponse> {
    // 1. Fetch offer by ID and userId
    const offer = await this._offerRepository.findByUserIdAndId(userId, offerId);
    if (!offer) {
      throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // 2. Check expiry
    const now = new Date();
    if (offer.offerExpiryDate < now) {
      throw new AppError(Messages.OFFER.EXPIRED, HttpStatusCode.BAD_REQUEST);
    }

    // 3. Verify status is PENDING
    if (offer.status !== OfferStatus.PENDING) {
      throw new AppError(Messages.OFFER.ALREADY_PROCESSED, HttpStatusCode.BAD_REQUEST);
    }

    // 4. Update status to ACCEPTED
    const updatedOffer = await this._offerRepository.updateStatus(offer.id, OfferStatus.ACCEPTED);

    // 5. Publish Kafka event
    try {
      await this._eventService.publish(Events.OFFER.ACCEPTED, {
        offerId: updatedOffer.id,
        applicationId: updatedOffer.applicationId,
        userId: updatedOffer.userId,
        companyId: updatedOffer.companyId,
        status: 'ACCEPTED',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn('Kafka not available, continuing...', error);
    }

    return this.mapToResponse(updatedOffer);
  }

  async rejectOffer(offerId: string, userId: string): Promise<OfferResponse> {
    // 1. Fetch offer by ID and userId
    const offer = await this._offerRepository.findByUserIdAndId(userId, offerId);
    if (!offer) {
      throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // 2. Check expiry
    const now = new Date();
    if (offer.offerExpiryDate < now) {
      throw new AppError(Messages.OFFER.EXPIRED, HttpStatusCode.BAD_REQUEST);
    }

    // 3. Verify status is PENDING
    if (offer.status !== OfferStatus.PENDING) {
      throw new AppError(Messages.OFFER.ALREADY_PROCESSED, HttpStatusCode.BAD_REQUEST);
    }

    // 4. Update status to REJECTED
    const updatedOffer = await this._offerRepository.updateStatus(offer.id, OfferStatus.REJECTED);

    // 5. Publish Kafka event
    try {
      await this._eventService.publish(Events.OFFER.REJECTED, {
        offerId: updatedOffer.id,
        applicationId: updatedOffer.applicationId,
        userId: updatedOffer.userId,
        companyId: updatedOffer.companyId,
        status: 'REJECTED',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn('Kafka not available, continuing...', error);
    }

    return this.mapToResponse(updatedOffer);
  }

  private mapToResponse(offer: any): OfferResponse {
    return {
      id: offer.id,
      applicationId: offer.applicationId,
      userId: offer.userId,
      companyId: offer.companyId,
      jobTitle: offer.jobTitle,
      ctc: offer.ctc,
      joiningDate: offer.joiningDate,
      location: offer.location,
      offerMessage: offer.offerMessage,
      offerExpiryDate: offer.offerExpiryDate,
      status: offer.status as OfferStatus,
      pdfUrl: offer.pdfUrl,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }
}

