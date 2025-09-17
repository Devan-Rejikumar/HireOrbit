import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { ProfileController } from '../controllers/ProfileController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import { ResumeController } from '../controllers/ResumeController';
import { CertificationController } from '../controllers/CertificationController';
import { AchievementController } from '../controllers/AchievementController';


const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);
const resumeController = container.get<ResumeController>('ResumeController');
const certificationController = container.get<CertificationController>('CertificationController');
const achievementController = container.get<AchievementController>('AchievementController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') ||
        file.mimetype === 'application?pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});


console.log('=== PROFILE ROUTES DEBUG ===');
console.log('ProfileController instantiated:', !!profileController);


router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Profile routes are working!',
    timestamp: new Date().toISOString(),
    cloudinaryConfig: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    }
  });
});


router.get('/current', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }
  
  
  const container = require('../config/inversify.config').default;
  const TYPES = require('../config/types').default;
  const profileService = container.get(TYPES.IProfileService);
  
  profileService.getProfile(userId).then((profile: any) => {
    res.json({ 
      success: true,
      data: { profile },
      message: 'Current profile fetched successfully'
    });
  }).catch((error: any) => {
    res.status(500).json({ error: error.message });
  });
});


router.post('/', authenticateToken, (req, res) => profileController.createProfile(req, res));
router.get('/', authenticateToken, (req, res) => profileController.getProfile(req, res));

router.put('/', authenticateToken, (req, res, next) => {
  console.log('🔍 [PROFILE-ROUTE] PUT /profile/ hit');
  console.log('🔍 [PROFILE-ROUTE] Content-Type:', req.headers['content-type']);
  console.log('🔍 [PROFILE-ROUTE] Request body keys:', Object.keys(req.body || {}));
  
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('🔍 [PROFILE-ROUTE] Processing multipart/form-data');
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('❌ [PROFILE-ROUTE] Multer error:', err);
        return res.status(400).json({ error: err.message });
      }
      
      console.log('🔍 [PROFILE-ROUTE] File received:', req.file ? 'YES' : 'NO');
      if (req.file) {
        console.log('🔍 [PROFILE-ROUTE] File details:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        
        // Convert uploaded file to base64 for Cloudinary
        const base64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64}`;
        req.body.profilePicture = dataURI;
        console.log('🔍 [PROFILE-ROUTE] Converted to base64 data URI, length:', dataURI.length);
      }
      
      console.log('🔍 [PROFILE-ROUTE] Final req.body keys:', Object.keys(req.body || {}));
      next();
    });
  } else {
    console.log('🔍 [PROFILE-ROUTE] Processing as regular JSON');
    next();
  }
}, (req, res) => profileController.updateProfile(req, res));
router.delete('/', authenticateToken, (req, res) => profileController.deleteProfile(req, res));

router.get('/full', authenticateToken, (req, res, next) => {
  console.log('=== /full route hit ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  next();
}, (req, res) => profileController.getFullProfile(req, res));


router.post('/experience', authenticateToken, (req, res) => profileController.addExperience(req, res));
router.put('/experience/:id', authenticateToken, (req, res) => profileController.updateExperience(req, res));
router.delete('/experience/:id', authenticateToken, (req, res) => profileController.deleteExperience(req, res));


router.post('/education', authenticateToken, (req, res) => profileController.addEducation(req, res));
router.put('/education/:id', authenticateToken, (req, res) => profileController.updateEducation(req, res));
router.delete('/education/:id', authenticateToken, (req, res) => profileController.deleteEducation(req, res));

router.post('/resume', authenticateToken, (req, res, next) => {if (req.body && req.body.resume) {next();} else {res.status(400).json({ error: 'No resume data found' });return;}}, (req, res) => resumeController.uploadResume(req, res));
router.get('/resume', authenticateToken, (req, res) => resumeController.getResume(req, res));
router.delete('/resume', authenticateToken, (req, res) => resumeController.deleteResume(req, res));


router.post('/certifications', authenticateToken, (req, res) => certificationController.addCertification(req, res));
router.get('/certifications', authenticateToken, (req, res) => certificationController.getCertifications(req, res));
router.put('/certifications/:certificationId', authenticateToken, (req, res) => certificationController.updateCertification(req, res));
router.delete('/certifications/:certificationId', authenticateToken, (req, res) => certificationController.deleteCertification(req, res));
router.get('/certifications/:certificationId', authenticateToken, (req, res) => certificationController.getCertificationById(req, res));


router.post('/achievements', authenticateToken, (req, res) => achievementController.addAchievement(req, res));
router.get('/achievements', authenticateToken, (req, res) => achievementController.getAchievements(req, res));
router.put('/achievements/:achievementId', authenticateToken, (req, res) => achievementController.updateAchievement(req, res));
router.delete('/achievements/:achievementId', authenticateToken, (req, res) => achievementController.deleteAchievement(req, res));
router.get('/achievements/:achievementId', authenticateToken, (req, res) => achievementController.getAchievementById(req, res));

export default router;
