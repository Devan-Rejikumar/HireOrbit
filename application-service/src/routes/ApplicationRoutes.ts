import { Router } from 'express';
import { container } from '../config/inversify.config';
import { ApplicationController } from '../controllers/ApplicationController';
import { asyncHandler } from '../utils/asyncHandler';
import { TYPES } from '../config/types';
import { authenticateToken } from '../middleware/auth.middleware';
import { APPLICATION_ROUTES } from '../constants/routes';
import { AuthRequest } from '../types/express';

const router = Router();
const applicationController = container.get<ApplicationController>(TYPES.ApplicationController);
router.get(APPLICATION_ROUTES.GET_TOP_APPLICANTS, asyncHandler((req: AuthRequest, res) => applicationController.getTopApplicants(req, res)));
router.get(APPLICATION_ROUTES.GET_TOP_JOBS, asyncHandler((req: AuthRequest, res) => applicationController.getTopJobs(req, res)));

router.use(authenticateToken);

router.post(APPLICATION_ROUTES.APPLY_FOR_JOB, asyncHandler((req: AuthRequest, res) => applicationController.applyForJob(req, res)));
router.get(APPLICATION_ROUTES.GET_USER_APPLICATIONS, asyncHandler((req: AuthRequest, res) => applicationController.getUserApplications(req, res)));
router.get(APPLICATION_ROUTES.CHECK_APPLICATION_STATUS, asyncHandler((req: AuthRequest, res) => applicationController.checkApplicationStatus(req, res)));
router.get(APPLICATION_ROUTES.GET_APPLICATION_BY_ID, asyncHandler((req: AuthRequest, res) => applicationController.getApplicationById(req, res)));
router.patch(APPLICATION_ROUTES.WITHDRAW_APPLICATION, asyncHandler((req: AuthRequest, res) => applicationController.withdrawApplication(req, res)));
router.get(APPLICATION_ROUTES.GET_COMPANY_APPLICATIONS, asyncHandler((req: AuthRequest, res) => applicationController.getCompanyApplications(req, res)));
router.patch(APPLICATION_ROUTES.UPDATE_APPLICATION_STATUS, asyncHandler((req: AuthRequest, res) => applicationController.updateApplicationStatus(req, res)));
router.put(APPLICATION_ROUTES.UPDATE_APPLICATION_STATUS, asyncHandler((req: AuthRequest, res) => applicationController.updateApplicationStatus(req, res)));
router.get(APPLICATION_ROUTES.VIEW_RESUME, asyncHandler((req: AuthRequest, res) => applicationController.viewResume(req, res)));
router.get(APPLICATION_ROUTES.DOWNLOAD_RESUME, asyncHandler((req: AuthRequest, res) => applicationController.downloadResume(req, res)));
router.post(APPLICATION_ROUTES.ADD_APPLICATION_NOTE, asyncHandler((req: AuthRequest, res) => applicationController.addApplicationNote(req, res)));
router.get(APPLICATION_ROUTES.GET_APPLICATION_DETAILS, asyncHandler((req: AuthRequest, res) => applicationController.getApplicationDetails(req, res)));
router.get(APPLICATION_ROUTES.SEARCH_APPLICATIONS, asyncHandler((req: AuthRequest, res) => applicationController.searchApplications(req, res)));
router.get(APPLICATION_ROUTES.GET_COMPANY_STATISTICS, asyncHandler((req: AuthRequest, res) => applicationController.getCompanyApplicationStats(req, res)));
router.patch(APPLICATION_ROUTES.BULK_UPDATE_STATUS, asyncHandler((req: AuthRequest, res) => applicationController.bulkUpdateApplicationStatus(req, res)));

export default router;