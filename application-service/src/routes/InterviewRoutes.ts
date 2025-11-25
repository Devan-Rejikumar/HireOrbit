import { Router, Request } from 'express';
import { container } from '../config/inversify.config';
import { InterviewController } from '../controllers/InterviewController';
import { asyncHandler } from '../utils/asyncHandler';
import { TYPES } from '../config/types';
import { authenticateToken } from '../middleware/auth.middleware';
import { INTERVIEW_ROUTES } from '../constants/routes';

const router = Router();
const interviewController = container.get<InterviewController>(TYPES.InterviewController);

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post(INTERVIEW_ROUTES.SCHEDULE_INTERVIEW, asyncHandler((req: Request, res) => interviewController.scheduleInterview(req, res)));
router.get(INTERVIEW_ROUTES.GET_INTERVIEW_BY_ID, asyncHandler((req: Request, res) => interviewController.getInterviewById(req, res)));
router.put(INTERVIEW_ROUTES.UPDATE_INTERVIEW, asyncHandler((req: Request, res) => interviewController.updateInterview(req, res)));
router.delete(INTERVIEW_ROUTES.CANCEL_INTERVIEW, asyncHandler((req: Request, res) => interviewController.cancelInterview(req, res)));
router.post(INTERVIEW_ROUTES.MAKE_INTERVIEW_DECISION, asyncHandler((req: Request, res) => interviewController.makeInterviewDecision(req, res)));
router.get(INTERVIEW_ROUTES.GET_INTERVIEWS_BY_APPLICATION, asyncHandler((req: Request, res) => interviewController.getInterviewsByApplication(req, res)));
router.get(INTERVIEW_ROUTES.GET_COMPANY_INTERVIEWS, asyncHandler((req: Request, res) => interviewController.getCompanyInterviews(req, res)));
router.get(INTERVIEW_ROUTES.GET_CANDIDATE_INTERVIEWS, asyncHandler((req: Request, res) => interviewController.getCandidateInterviews(req, res)));

export default router;