import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { JobController } from '../controllers/JobController';
import { authenticateToken } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const jobController = container.get<JobController>(TYPES.JobController);

router.post('/', authenticateToken, asyncHandler((req, res) => jobController.createJob(req, res)));
router.get('/', asyncHandler((req, res) => jobController.getAllJobs(req, res)));
router.get('/search', asyncHandler((req, res) => jobController.searchJobs(req, res))); 
router.get('/suggestions', asyncHandler((req, res) => jobController.getJobSuggestions(req, res))); 
router.get('/company/:companyId/count', authenticateToken, asyncHandler((req, res) => jobController.getJobCountByCompany(req, res))); 
router.get('/company/:companyId', authenticateToken, asyncHandler((req, res) => jobController.getJobsByCompany(req, res))); 
router.get('/:id', asyncHandler((req, res) => jobController.getJobById(req, res))); 
router.put('/:id', authenticateToken, asyncHandler((req, res) => jobController.updateJob(req, res)));
router.delete('/:id', authenticateToken, asyncHandler((req, res) => jobController.deleteJob(req, res)));

export default router;
