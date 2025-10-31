import { Router, Request } from 'express';
import { container } from '../config/inversify.config';
import { InterviewController } from '../controllers/InterviewController';
import { TYPES } from '../config/types';

const router = Router();
const interviewController = container.get<InterviewController>(TYPES.InterviewController);


router.post('/', (req: Request, res) => interviewController.scheduleInterview(req, res));
router.get('/:id', (req: Request, res) => interviewController.getInterviewById(req, res));
router.put('/:id', (req: Request, res) => interviewController.updateInterview(req, res));
router.delete('/:id', (req: Request, res) => interviewController.cancelInterview(req, res));
router.post('/:id/decision', (req: Request, res) => interviewController.makeInterviewDecision(req, res));
router.get('/application/:applicationId', (req: Request, res) => interviewController.getInterviewsByApplication(req, res));
router.get('/company/all', (req: Request, res) => interviewController.getCompanyInterviews(req, res));
router.get('/candidate/all', (req: Request, res) => interviewController.getCandidateInterviews(req, res));

export default router;