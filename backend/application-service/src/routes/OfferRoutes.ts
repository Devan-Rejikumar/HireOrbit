import { Router, Request } from 'express';
import { container } from '../config/inversify.config';
import { OfferController } from '../controllers/OfferController';
import { asyncHandler } from '../utils/asyncHandler';
import { TYPES } from '../config/types';
import { authenticateToken } from '../middleware/auth.middleware';
import { OFFER_ROUTES } from '../constants/routes';

const router = Router();

// Get controller with error handling
let offerController: OfferController;
try {
  offerController = container.get<OfferController>(TYPES.OfferController);
  console.log('[OfferRoutes] OfferController initialized successfully');
} catch (error) {
  console.error('[OfferRoutes] Failed to initialize OfferController:', error);
  throw error;
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Company endpoints
router.get(OFFER_ROUTES.GET_COMPANY_OFFERS, asyncHandler((req: Request, res) => offerController.getCompanyOffers(req, res)));

// User endpoints - MUST be before /:offerId route to avoid matching conflicts
console.log('[OfferRoutes] Registering GET_USER_OFFERS route:', OFFER_ROUTES.GET_USER_OFFERS);
router.get('/users/me/offers', asyncHandler((req: Request, res) => {
  console.log('[OfferRoutes] GET /users/me/offers hit!');
  return offerController.getUserOffers(req, res);
}));

// Shared endpoints (both user and company)
router.get(OFFER_ROUTES.GET_OFFER_BY_ID, asyncHandler((req: Request, res) => offerController.getOfferById(req, res)));
router.get(OFFER_ROUTES.DOWNLOAD_OFFER_PDF, asyncHandler((req: Request, res) => offerController.downloadOfferPdf(req, res)));

// User action endpoints
router.post(OFFER_ROUTES.ACCEPT_OFFER, asyncHandler((req: Request, res) => offerController.acceptOffer(req, res)));
router.post(OFFER_ROUTES.REJECT_OFFER, asyncHandler((req: Request, res) => offerController.rejectOffer(req, res)));

export default router;

