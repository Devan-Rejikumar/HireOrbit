import { Router, Request } from 'express';
import { container } from '../config/inversify.config';
import { ApplicationController } from '../controllers/ApplicationController';
import { asyncHandler } from '../utils/asyncHandler';
import {TYPES} from '../config/types';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends Request {
  headers: {
    'x-user-id'?: string;
    'x-user-email'?: string;
    'x-user-role'?: string;
    [key: string]: any;
  };
}

const router = Router();
const applicationController = container.get<ApplicationController>(TYPES.ApplicationController);

router.use(authenticateToken);

router.post('/apply', asyncHandler((req: AuthRequest, res) => applicationController.applyForJob(req, res)));
router.get('/user/applications', asyncHandler((req: AuthRequest, res) => applicationController.getUserApplications(req, res)));
router.get('/check-status/:jobId', asyncHandler((req: AuthRequest, res) => applicationController.checkApplicationStatus(req, res)));
router.get('/:id', asyncHandler((req: AuthRequest, res) => applicationController.getApplicationById(req, res)));
router.patch('/:id/withdraw', asyncHandler((req: AuthRequest, res) => applicationController.withdrawApplication(req, res)));
router.get('/company/applications', asyncHandler((req: AuthRequest, res) => applicationController.getCompanyApplications(req, res)));
router.patch('/:id/status', asyncHandler((req: AuthRequest, res) => applicationController.updateApplicationStatus(req, res)));
router.put('/:id/status', asyncHandler((req: AuthRequest, res) => applicationController.updateApplicationStatus(req, res)));
router.get('/:applicationId/resume/view', asyncHandler((req: AuthRequest, res) => applicationController.viewResume(req, res)));
router.get('/:applicationId/resume/download', asyncHandler((req: AuthRequest, res) => applicationController.downloadResume(req, res)));
router.post('/:id/notes', asyncHandler((req: AuthRequest, res) => applicationController.addApplicationNote(req, res)));
router.get('/company/:id/details', asyncHandler((req: AuthRequest, res) => applicationController.getApplicationDetails(req, res)));
router.get('/search/applications', asyncHandler((req: AuthRequest, res) => applicationController.searchApplications(req, res)));
router.get('/company/statistics', asyncHandler((req: AuthRequest, res) => applicationController.getCompanyApplicationStats(req, res)));
router.patch('/bulk/status', asyncHandler((req: AuthRequest, res) => applicationController.bulkUpdateApplicationStatus(req, res)));

export default router;