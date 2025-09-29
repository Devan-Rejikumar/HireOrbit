import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { CompanyController } from '../controllers/CompanyController';



const router = Router();
const companyController = container.get<CompanyController>(TYPES.CompanyController);

router.post('/register',(req,res)=> companyController.register(req,res));
router.post('/login',(req,res)=>companyController.login(req,res));
router.post('/refresh-token',(req,res)=>companyController.refreshToken(req,res));
router.post('/generate-otp',(req,res)=>companyController.generateOTP(req,res));
router.post('/verify-otp',(req,res)=>companyController.verifyOTP(req,res));
router.post('/resend-otp',(req,res)=>companyController.resendOTP(req,res));
router.get('/me',(req, res) => companyController.getMe(req, res));
router.post('/logout', (req, res) => companyController.logout(req, res));
router.get('/companies',(req,res)=> companyController.getAllCompanies(req,res));
router.patch('/companies/:id/block',(req,res)=>companyController.blockCompany(req,res));
router.patch('/companies/:id/unblock',(req,res)=>companyController.unblockCompany(req,res));
router.post('/profile/step2',(req, res) => companyController.completeStep2(req, res));
router.post('/profile/step3',(req, res) => companyController.completeStep3(req, res));

router.get('/profile',(req, res) => companyController.getCompanyProfile(req, res));
router.get('/profile/step',(req, res) => companyController.getProfileStep(req, res));

router.get('/admin/pending',(req, res) => companyController.getPendingCompanies(req, res));
router.get('/admin/all',(req, res) => companyController.getAllCompaniesForAdmin(req, res));
router.get('/admin/:id',(req, res) => companyController.getCompanyDetailsForAdmin(req, res));
router.post('/admin/:id/approve',(req, res) => companyController.approveCompany(req, res));
router.post('/admin/:id/reject',(req, res) => companyController.rejectCompany(req, res));
router.get('/job-count', (req, res) => companyController.getCompanyJobCount(req, res));

router.put('/profile',(req,res)=> companyController.updateCompanyProfile(req,res));

router.post('/reapply',(req, res) => companyController.reapplyCompany(req, res));
router.get('/reapply-status',(req, res) => companyController.getReapplyStatus(req, res));

router.get('/search', (req, res) => companyController.searchCompanyByName(req, res));

export default router;