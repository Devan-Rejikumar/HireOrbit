import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { ProfileController } from '../controllers/ProfileController';
import { ResumeController } from '../controllers/ResumeController';
import { CertificationController } from '../controllers/CertificationController';
import { AchievementController } from '../controllers/AchievementController';
import { authenticateToken } from '../middleware/auth';
import { handleProfilePictureUpload } from '../middleware/fileUpload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);
const resumeController = container.get<ResumeController>(TYPES.ResumeController);
const certificationController = container.get<CertificationController>(TYPES.CertificationController);
const achievementController = container.get<AchievementController>(TYPES.AchievementController);

// Profile routes
router.get('/current', authenticateToken, asyncHandler((req, res) => profileController.getCurrentProfile(req, res)));
router.post('/', authenticateToken, asyncHandler((req, res) => profileController.createProfile(req, res)));
router.get('/', authenticateToken, asyncHandler((req, res) => profileController.getProfile(req, res)));
router.put('/', authenticateToken, handleProfilePictureUpload, asyncHandler((req, res) => profileController.updateProfile(req, res)));
router.delete('/', authenticateToken, asyncHandler((req, res) => profileController.deleteProfile(req, res)));
router.get('/full', authenticateToken, asyncHandler((req, res) => profileController.getFullProfile(req, res)));

// Experience routes
router.post('/experience', authenticateToken, asyncHandler((req, res) => profileController.addExperience(req, res)));
router.put('/experience/:id', authenticateToken, asyncHandler((req, res) => profileController.updateExperience(req, res)));
router.delete('/experience/:id', authenticateToken, asyncHandler((req, res) => profileController.deleteExperience(req, res)));

// Education routes
router.post('/education', authenticateToken, asyncHandler((req, res) => profileController.addEducation(req, res)));
router.put('/education/:id', authenticateToken, asyncHandler((req, res) => profileController.updateEducation(req, res)));
router.delete('/education/:id', authenticateToken, asyncHandler((req, res) => profileController.deleteEducation(req, res)));

// Resume routes
router.post('/resume', authenticateToken, asyncHandler((req, res) => resumeController.uploadResume(req, res)));
router.get('/resume', authenticateToken, asyncHandler((req, res) => resumeController.getResume(req, res)));
router.delete('/resume', authenticateToken, asyncHandler((req, res) => resumeController.deleteResume(req, res)));

// Certification routes
router.post('/certifications', authenticateToken, asyncHandler((req, res) => certificationController.addCertification(req, res)));
router.get('/certifications', authenticateToken, asyncHandler((req, res) => certificationController.getCertifications(req, res)));
router.put('/certifications/:certificationId', authenticateToken, asyncHandler((req, res) => certificationController.updateCertification(req, res)));
router.delete('/certifications/:certificationId', authenticateToken, asyncHandler((req, res) => certificationController.deleteCertification(req, res)));
router.get('/certifications/:certificationId', authenticateToken, asyncHandler((req, res) => certificationController.getCertificationById(req, res)));

// Achievement routes
router.post('/achievements', authenticateToken, asyncHandler((req, res) => achievementController.addAchievement(req, res)));
router.get('/achievements', authenticateToken, asyncHandler((req, res) => achievementController.getAchievements(req, res)));
router.put('/achievements/:achievementId', authenticateToken, asyncHandler((req, res) => achievementController.updateAchievement(req, res)));
router.delete('/achievements/:achievementId', authenticateToken, asyncHandler((req, res) => achievementController.deleteAchievement(req, res)));
router.get('/achievements/:achievementId', authenticateToken, asyncHandler((req, res) => achievementController.getAchievementById(req, res)));

export default router;