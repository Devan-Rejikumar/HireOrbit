import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { AdminController } from '../controllers/AdminController';



const router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

router.use((req, res, next) => {
  console.log('[AdminRoutes] Route accessed:', req.method, req.path, 'Body:', req.body);
  next();
});
router.post('/login', (req, res) => {
  console.log('[AdminRoutes] Admin login route hit in user service');
  adminController.login(req, res);
});
router.post('/refresh-token', (req, res) => adminController.refreshToken(req, res));
router.get('/users',(req,res)=>adminController.getAllUsers(req,res));
router.patch('/users/:id/block',(req,res)=>adminController.blockUser(req,res));
router.patch('/users/:id/unblock',(req,res)=>adminController.unblockUser(req,res));
router.post('/logout',(req,res)=>adminController.logout(req,res));
router.get('/me',(req,res)=>adminController.me(req,res));
export default router;