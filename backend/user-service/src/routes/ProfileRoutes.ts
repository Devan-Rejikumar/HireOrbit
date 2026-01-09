import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { ProfileController } from '../controllers/ProfileController';
import { ResumeController } from '../controllers/ResumeController';
import { CertificationController } from '../controllers/CertificationController';
import { AchievementController } from '../controllers/AchievementController';
import { authenticateToken } from '../middleware/auth.middleware';
import { handleProfilePictureUpload } from '../middleware/file-upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { PROFILE_ROUTES } from '../constants/routes';

const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);
const resumeController = container.get<ResumeController>(TYPES.ResumeController);
const certificationController = container.get<CertificationController>(TYPES.CertificationController);
const achievementController = container.get<AchievementController>(TYPES.AchievementController);

// Profile routes
router.get(PROFILE_ROUTES.GET_CURRENT_PROFILE, authenticateToken, asyncHandler((req, res) => profileController.getCurrentProfile(req, res)));
router.post(PROFILE_ROUTES.CREATE_PROFILE, authenticateToken, asyncHandler((req, res) => profileController.createProfile(req, res)));
router.get(PROFILE_ROUTES.GET_PROFILE, authenticateToken, asyncHandler((req, res) => profileController.getProfile(req, res)));
router.put(PROFILE_ROUTES.UPDATE_PROFILE, authenticateToken, handleProfilePictureUpload, asyncHandler((req, res) => profileController.updateProfile(req, res)));
router.delete(PROFILE_ROUTES.DELETE_PROFILE, authenticateToken, asyncHandler((req, res) => profileController.deleteProfile(req, res)));
router.get(PROFILE_ROUTES.GET_FULL_PROFILE, authenticateToken, asyncHandler((req, res) => profileController.getFullProfile(req, res)));

// Experience routes
router.post(PROFILE_ROUTES.ADD_EXPERIENCE, authenticateToken, asyncHandler((req, res) => profileController.addExperience(req, res)));
router.put(PROFILE_ROUTES.UPDATE_EXPERIENCE, authenticateToken, asyncHandler((req, res) => profileController.updateExperience(req, res)));
router.delete(PROFILE_ROUTES.DELETE_EXPERIENCE, authenticateToken, asyncHandler((req, res) => profileController.deleteExperience(req, res)));

// Education routes
router.post(PROFILE_ROUTES.ADD_EDUCATION, authenticateToken, asyncHandler((req, res) => profileController.addEducation(req, res)));
router.put(PROFILE_ROUTES.UPDATE_EDUCATION, authenticateToken, asyncHandler((req, res) => profileController.updateEducation(req, res)));
router.delete(PROFILE_ROUTES.DELETE_EDUCATION, authenticateToken, asyncHandler((req, res) => profileController.deleteEducation(req, res)));

// Resume routes
router.post(PROFILE_ROUTES.UPLOAD_RESUME, authenticateToken, asyncHandler((req, res) => resumeController.uploadResume(req, res)));
router.get(PROFILE_ROUTES.GET_RESUME, authenticateToken, asyncHandler((req, res) => resumeController.getResume(req, res)));
router.delete(PROFILE_ROUTES.DELETE_RESUME, authenticateToken, asyncHandler((req, res) => resumeController.deleteResume(req, res)));

// Certification routes
router.post(PROFILE_ROUTES.ADD_CERTIFICATION, authenticateToken, asyncHandler((req, res) => certificationController.addCertification(req, res)));
router.get(PROFILE_ROUTES.GET_CERTIFICATIONS, authenticateToken, asyncHandler((req, res) => certificationController.getCertifications(req, res)));
router.put(PROFILE_ROUTES.UPDATE_CERTIFICATION, authenticateToken, asyncHandler((req, res) => certificationController.updateCertification(req, res)));
router.delete(PROFILE_ROUTES.DELETE_CERTIFICATION, authenticateToken, asyncHandler((req, res) => certificationController.deleteCertification(req, res)));
router.get(PROFILE_ROUTES.GET_CERTIFICATION_BY_ID, authenticateToken, asyncHandler((req, res) => certificationController.getCertificationById(req, res)));

// Achievement routes
router.post(PROFILE_ROUTES.ADD_ACHIEVEMENT, authenticateToken, asyncHandler((req, res) => achievementController.addAchievement(req, res)));
router.get(PROFILE_ROUTES.GET_ACHIEVEMENTS, authenticateToken, asyncHandler((req, res) => achievementController.getAchievements(req, res)));
router.put(PROFILE_ROUTES.UPDATE_ACHIEVEMENT, authenticateToken, asyncHandler((req, res) => achievementController.updateAchievement(req, res)));
router.delete(PROFILE_ROUTES.DELETE_ACHIEVEMENT, authenticateToken, asyncHandler((req, res) => achievementController.deleteAchievement(req, res)));
router.get(PROFILE_ROUTES.GET_ACHIEVEMENT_BY_ID, authenticateToken, asyncHandler((req, res) => achievementController.getAchievementById(req, res)));

export default router;