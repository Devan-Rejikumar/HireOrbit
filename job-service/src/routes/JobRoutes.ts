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

router.get('/test-controller', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Controller test successful' });
});

router.get('/test-simple', (req, res) => {
  console.log('🔍 [JobRoutes] Simple test route hit');
  res.json({ message: 'Simple test successful' });
});

router.post('/', authenticateToken, (req, res) => jobController.createJob(req, res));
router.get('/', (req, res) => {
  console.log('🔍 [JobRoutes] GET / route hit - calling getAllJobs');
  jobController.getAllJobs(req, res);
}); // Public - no auth needed
router.get('/search', (req, res) => jobController.searchJobs(req, res)); // Public - no auth needed
router.get('/company/:companyId/count', (req, res) => jobController.getJobCountByCompany(req, res)); // Public - no auth needed
router.get('/:id', (req, res) => jobController.getJobById(req, res)); // Public - no auth needed
router.get('/suggestions', (req, res) => jobController.getJobSuggestions(req, res)); // Public - no auth needed

router.get('/company/:companyId', (req, res) => jobController.getJobsByCompany(req, res)); // Public - no auth needed
router.put('/:id', authenticateToken, (req, res) => jobController.updateJob(req, res));
router.delete('/:id', authenticateToken, (req, res) => jobController.deleteJob(req, res));

export default router;
