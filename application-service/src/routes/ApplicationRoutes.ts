import { Router, Request } from 'express';
import { container } from '../config/inversify.config';
import { ApplicationController } from '../controllers/ApplicationController';

import {TYPES} from '../config/types';

// Define AuthRequest interface for header-based authentication
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

router.post('/apply',(req: AuthRequest, res) => 
  applicationController.applyForJob(req, res)
);
router.get('/user/applications',(req: AuthRequest, res) => 
  applicationController.getUserApplications(req, res)
);
router.get('/check-status/:jobId',(req: AuthRequest, res) => 
  applicationController.checkApplicationStatus(req, res)
);
router.get('/:id',(req: AuthRequest, res) => 
  applicationController.getApplicationById(req, res)
);
router.patch('/:id/withdraw',(req: AuthRequest, res) => 
  applicationController.withdrawApplication(req, res)
);


router.get('/company/applications',(req: AuthRequest, res) => 
  applicationController.getCompanyApplications(req, res)
);
router.patch('/:id/status',(req: AuthRequest, res) => 
  applicationController.updateApplicationStatus(req, res)
);
router.post('/:id/notes',(req: AuthRequest, res) => 
  applicationController.addApplicationNote(req, res)
);
router.get('/company/:id/details',(req: AuthRequest, res) => 
  applicationController.getApplicationDetails(req, res)
);

router.get('/search/applications',(req: AuthRequest, res) => 
  applicationController.searchApplications(req, res)
);
router.get('/company/statistics',(req: AuthRequest, res) => 
  applicationController.getCompanyApplicationStats(req, res)
);


router.patch('/bulk/status',(req: AuthRequest, res) => 
  applicationController.bulkUpdateApplicationStatus(req, res)
);

export default router;