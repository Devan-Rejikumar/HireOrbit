import { Router, Request } from 'express';
import { container } from '../config/inversify.config';
import { InterviewController } from '../controllers/InterviewController';
import { asyncHandler } from '../utils/asyncHandler';
import { TYPES } from '../config/types';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const interviewController = container.get<InterviewController>(TYPES.InterviewController);

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post('/', asyncHandler((req: Request, res) => interviewController.scheduleInterview(req, res)));
router.get('/:id', asyncHandler((req: Request, res) => interviewController.getInterviewById(req, res)));
router.put('/:id', asyncHandler((req: Request, res) => interviewController.updateInterview(req, res)));
router.delete('/:id', asyncHandler((req: Request, res) => interviewController.cancelInterview(req, res)));
router.post('/:id/decision', asyncHandler((req: Request, res) => interviewController.makeInterviewDecision(req, res)));
router.get('/application/:applicationId', asyncHandler((req: Request, res) => interviewController.getInterviewsByApplication(req, res)));
router.get('/company/all', asyncHandler((req: Request, res) => interviewController.getCompanyInterviews(req, res)));
router.get('/candidate/all', asyncHandler((req: Request, res) => interviewController.getCandidateInterviews(req, res)));

export default router;