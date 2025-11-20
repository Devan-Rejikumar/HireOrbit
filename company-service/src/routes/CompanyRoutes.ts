import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { CompanyAuthController } from '../controllers/CompanyAuthController';
import { CompanyProfileController } from '../controllers/CompanyProfileController';
import { CompanyAdminController } from '../controllers/CompanyAdminController';
import { authenticateCompany } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const companyAuthController = container.get<CompanyAuthController>(TYPES.CompanyAuthController);
const companyProfileController = container.get<CompanyProfileController>(TYPES.CompanyProfileController);
const companyAdminController = container.get<CompanyAdminController>(TYPES.CompanyAdminController);

// Auth routes
router.post('/register', asyncHandler((req, res) => companyAuthController.register(req, res)));
router.post('/login', asyncHandler((req, res) => companyAuthController.login(req, res)));
router.post('/refresh-token', asyncHandler((req, res) => companyAuthController.refreshToken(req, res)));
router.post('/generate-otp', asyncHandler((req, res) => companyAuthController.generateOTP(req, res)));
router.post('/verify-otp', asyncHandler((req, res) => companyAuthController.verifyOTP(req, res)));
router.post('/resend-otp', asyncHandler((req, res) => companyAuthController.resendOTP(req, res)));
router.post('/logout', authenticateCompany, asyncHandler((req, res) => companyAuthController.logout(req, res)));

// Profile routes (protected)
router.get('/me', authenticateCompany, asyncHandler((req, res) => companyProfileController.getMe(req, res)));
router.get('/profile', authenticateCompany, asyncHandler((req, res) => companyProfileController.getCompanyProfile(req, res)));
router.put('/profile', authenticateCompany, asyncHandler((req, res) => companyProfileController.updateCompanyProfile(req, res)));
router.get('/profile/step', authenticateCompany, asyncHandler((req, res) => companyProfileController.getProfileStep(req, res)));
router.post('/profile/step2', authenticateCompany, asyncHandler((req, res) => companyProfileController.completeStep2(req, res)));
router.post('/profile/step3', authenticateCompany, asyncHandler((req, res) => companyProfileController.completeStep3(req, res)));
router.get('/job-count', authenticateCompany, asyncHandler((req, res) => companyProfileController.getCompanyJobCount(req, res)));
router.post('/reapply', authenticateCompany, asyncHandler((req, res) => companyProfileController.reapplyCompany(req, res)));
router.get('/reapply-status', authenticateCompany, asyncHandler((req, res) => companyProfileController.getReapplyStatus(req, res)));

// Admin routes (protected)
router.get('/companies', authenticateCompany, asyncHandler((req, res) => companyAdminController.getAllCompanies(req, res)));
router.patch('/companies/:id/block', authenticateCompany, asyncHandler((req, res) => companyAdminController.blockCompany(req, res)));
router.patch('/companies/:id/unblock', authenticateCompany, asyncHandler((req, res) => companyAdminController.unblockCompany(req, res)));
router.get('/admin/pending', authenticateCompany, asyncHandler((req, res) => companyAdminController.getPendingCompanies(req, res)));
router.get('/admin/all', authenticateCompany, asyncHandler((req, res) => companyAdminController.getAllCompaniesForAdmin(req, res)));
router.get('/admin/:id', authenticateCompany, asyncHandler((req, res) => companyAdminController.getCompanyDetailsForAdmin(req, res)));
router.post('/admin/:id/approve', authenticateCompany, asyncHandler((req, res) => companyAdminController.approveCompany(req, res)));
router.post('/admin/:id/reject', authenticateCompany, asyncHandler((req, res) => companyAdminController.rejectCompany(req, res)));

// Public routes
router.get('/search', asyncHandler((req, res) => companyAdminController.searchCompanyByName(req, res)));

export default router;
