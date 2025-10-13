import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { CompanyController } from '../controllers/CompanyController';
import { authenticateCompany } from '../middleware/auth.middleware';



const router = Router();
const companyController = container.get<CompanyController>(TYPES.CompanyController);

router.post('/register',(req,res)=> companyController.register(req,res));
router.post('/login',(req,res)=>companyController.login(req,res));
router.post('/refresh-token',(req,res)=>companyController.refreshToken(req,res));
router.post('/generate-otp',(req,res)=>companyController.generateOTP(req,res));
router.post('/verify-otp',(req,res)=>companyController.verifyOTP(req,res));
router.post('/resend-otp',(req,res)=>companyController.resendOTP(req,res));
router.get('/me', authenticateCompany, (req, res) => companyController.getMe(req, res));
router.post('/logout', authenticateCompany, (req, res) => companyController.logout(req, res));
router.get('/companies', authenticateCompany, (req,res)=> companyController.getAllCompanies(req,res));
router.patch('/companies/:id/block', authenticateCompany, (req,res)=>companyController.blockCompany(req,res));
router.patch('/companies/:id/unblock', authenticateCompany, (req,res)=>companyController.unblockCompany(req,res));
router.post('/profile/step2', authenticateCompany, (req, res) => companyController.completeStep2(req, res));
router.post('/profile/step3', authenticateCompany, (req, res) => companyController.completeStep3(req, res));

router.get('/profile', authenticateCompany, (req, res) => companyController.getCompanyProfile(req, res));
router.get('/profile/step', authenticateCompany, (req, res) => companyController.getProfileStep(req, res));

router.get('/admin/pending', authenticateCompany, (req, res) => companyController.getPendingCompanies(req, res));
router.get('/admin/all', authenticateCompany, (req, res) => companyController.getAllCompaniesForAdmin(req, res));
router.get('/admin/:id', authenticateCompany, (req, res) => companyController.getCompanyDetailsForAdmin(req, res));
router.post('/admin/:id/approve', authenticateCompany, (req, res) => companyController.approveCompany(req, res));
router.post('/admin/:id/reject', authenticateCompany, (req, res) => companyController.rejectCompany(req, res));
router.get('/job-count', authenticateCompany, (req, res) => companyController.getCompanyJobCount(req, res));

router.put('/profile', authenticateCompany, (req,res)=> companyController.updateCompanyProfile(req,res));

router.post('/reapply', authenticateCompany, (req, res) => companyController.reapplyCompany(req, res));
router.get('/reapply-status', authenticateCompany, (req, res) => companyController.getReapplyStatus(req, res));

router.get('/search', (req, res) => companyController.searchCompanyByName(req, res));

export default router;