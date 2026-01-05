import { Router, Request, Response, NextFunction } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { CompanyOfferTemplateController } from '../controllers/CompanyOfferTemplateController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';
import { OFFER_TEMPLATE_ROUTES } from '../constants/routes';

const router = Router();

let templateController: CompanyOfferTemplateController;
try {
  templateController = container.get<CompanyOfferTemplateController>(TYPES.CompanyOfferTemplateController);
} catch (error) {
  throw error;
}

router.use(authenticateToken);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/svg+xml',
    ];

    if (allowedMimes.includes(file.mimetype) || 
        /\.(png|jpg|jpeg|gif|svg)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, GIF, SVG) are allowed'));
    }
  },
});

const handleMulterError = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error('[OfferTemplateRoutes] Multer error:', err.message);
  
  if (err.message.includes('Only image files')) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }
  
  if (err.message.includes('File too large') || err.message.includes('LIMIT_FILE_SIZE')) {
    res.status(400).json({
      success: false,
      message: 'File size exceeds 5MB limit',
    });
    return;
  }
  
  res.status(400).json({
    success: false,
    message: `File upload error: ${err.message}`,
  });
};

console.log('[OfferTemplateRoutes] Registering GET route:', OFFER_TEMPLATE_ROUTES.GET_TEMPLATE);
router.get(OFFER_TEMPLATE_ROUTES.GET_TEMPLATE, (req, res, next) => {
  console.log(`[OfferTemplateRoutes] GET ${req.originalUrl} hit the template route!`);
  next();
}, asyncHandler((req: Request, res) => templateController.getTemplate(req, res)));
router.post(OFFER_TEMPLATE_ROUTES.CREATE_OR_UPDATE_TEMPLATE, asyncHandler((req: Request, res) => templateController.createOrUpdateTemplate(req, res)));
router.put(OFFER_TEMPLATE_ROUTES.CREATE_OR_UPDATE_TEMPLATE, asyncHandler((req: Request, res) => templateController.createOrUpdateTemplate(req, res)));

router.post(
  OFFER_TEMPLATE_ROUTES.UPLOAD_LOGO,
  upload.single('logo'),
  handleMulterError,
  asyncHandler((req: Request, res) => templateController.uploadLogo(req, res)),
);

router.post(
  OFFER_TEMPLATE_ROUTES.UPLOAD_SIGNATURE,
  upload.single('signature'),
  handleMulterError,
  asyncHandler((req: Request, res) => templateController.uploadSignature(req, res)),
);

router.post(OFFER_TEMPLATE_ROUTES.PREVIEW_TEMPLATE, asyncHandler((req: Request, res) => templateController.previewTemplate(req, res)));

export default router;

