import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { JobController } from '../controllers/JobController';
import { JobReportController } from '../controllers/JobReportController';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { JOB_ROUTES } from '../constants/routes';

const router = Router();
const jobController = container.get<JobController>(TYPES.JobController);
const jobReportController = container.get<JobReportController>(TYPES.JobReportController);

router.post(JOB_ROUTES.CREATE_JOB, authenticateToken, asyncHandler((req, res) => jobController.createJob(req, res)));
router.get(JOB_ROUTES.GET_ALL_JOBS, asyncHandler((req, res) => jobController.getAllJobs(req, res)));
router.get(JOB_ROUTES.SEARCH_JOBS, asyncHandler((req, res) => jobController.searchJobs(req, res))); 
router.get(JOB_ROUTES.GET_JOB_SUGGESTIONS, asyncHandler((req, res) => jobController.getJobSuggestions(req, res))); 
router.get(JOB_ROUTES.GET_JOB_COUNT_BY_COMPANY, authenticateToken, asyncHandler((req, res) => jobController.getJobCountByCompany(req, res))); 
router.get(JOB_ROUTES.GET_JOBS_BY_COMPANY, authenticateToken, asyncHandler((req, res) => jobController.getJobsByCompany(req, res))); 
router.get(JOB_ROUTES.GET_JOB_BY_ID, asyncHandler((req, res) => jobController.getJobById(req, res))); 
router.put(JOB_ROUTES.UPDATE_JOB, authenticateToken, asyncHandler((req, res) => jobController.updateJob(req, res)));
router.delete(JOB_ROUTES.DELETE_JOB, authenticateToken, asyncHandler((req, res) => jobController.deleteJob(req, res)));
router.post(JOB_ROUTES.REPORT_JOB, authenticateToken, asyncHandler((req, res) => jobReportController.reportJob(req, res)));
router.get(JOB_ROUTES.GET_REPORTED_JOBS, authenticateToken, asyncHandler((req, res) => jobReportController.getReportedJobs(req, res)));
router.get(JOB_ROUTES.GET_TOTAL_JOB_COUNT, asyncHandler((req, res) => jobController.getTotalJobCount(req, res)));
router.get(JOB_ROUTES.GET_JOB_STATISTICS_TIME_SERIES, asyncHandler((req, res) => jobController.getJobStatisticsByTimePeriod(req, res)));
router.get(JOB_ROUTES.GET_TOP_COMPANIES, asyncHandler((req, res) => jobController.getTopCompaniesByJobCount(req, res)));

export default router;
