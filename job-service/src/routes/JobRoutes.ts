import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { JobController } from '../controllers/JobController';
import { authenticateToken } from '../middleware/authMiddleware';


const router = Router();
const jobController = container.get<JobController>(TYPES.JobController);

router.use((req, res, next) => {
  console.log(`Job Routes: ${req.method} ${req.url}`);
  console.log('Job Routes: Body:', req.body);
  next();
});

router.post('/',authenticateToken, (req, res) => jobController.createJob(req, res));
router.get('/', (req, res) => {jobController.getAllJobs(req, res);});
router.get('/search', (req, res) => jobController.searchJobs(req, res)); 
router.get('/suggestions', (req, res) => jobController.getJobSuggestions(req, res)); 
router.get('/company/:companyId/count',authenticateToken, (req, res) => jobController.getJobCountByCompany(req, res)); 
router.get('/company/:companyId',authenticateToken, (req, res) => jobController.getJobsByCompany(req, res)); 
router.get('/:id', (req, res) => jobController.getJobById(req, res)); 
router.put('/:id',authenticateToken, (req, res) => jobController.updateJob(req, res));
router.delete('/:id',authenticateToken,(req, res) => jobController.deleteJob(req, res));

export default router;
