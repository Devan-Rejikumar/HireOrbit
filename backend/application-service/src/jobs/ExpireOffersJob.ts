import { injectable, inject } from 'inversify';
import { IOfferRepository } from '../repositories/interfaces/IOfferRepository';
import { OfferStatus } from '../enums/OfferStatus';
import { TYPES } from '../config/types';
import { logger } from '../utils/logger';
import { IEventService } from '../services/interfaces/IEventService';
import { Events } from '../constants/Events';

@injectable()
export class ExpireOffersJob {
  constructor(
    @inject(TYPES.IOfferRepository) private _offerRepository: IOfferRepository,
    @inject(TYPES.IEventService) private _eventService: IEventService,
  ) {}

  async expireOffers(): Promise<void> {
    try {
      logger.info('[ExpireOffersJob] Starting offer expiry job...');
      
      const expiredOffers = await this._offerRepository.findExpiredOffers();
      
      if (expiredOffers.length === 0) {
        logger.info('[ExpireOffersJob] No expired offers found');
        return;
      }

      logger.info(`[ExpireOffersJob] Found ${expiredOffers.length} expired offers`);

      for (const offer of expiredOffers) {
        try {
          await this._offerRepository.updateStatus(offer.id, OfferStatus.EXPIRED);
          try {
            await this._eventService.publish(Events.OFFER.EXPIRED, {
              offerId: offer.id,
              applicationId: offer.applicationId,
              userId: offer.userId,
              companyId: offer.companyId,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            logger.warn(`[ExpireOffersJob] Failed to publish event for offer ${offer.id}:`, error);
          }
        } catch (error) {
          logger.error(`[ExpireOffersJob] Failed to expire offer ${offer.id}:`, error);
        }
      }

      logger.info(`[ExpireOffersJob] Successfully expired ${expiredOffers.length} offers`);
    } catch (error) {
      logger.error('[ExpireOffersJob] Error running expire offers job:', error);
      throw error;
    }
  }
}

