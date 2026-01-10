import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IProfileService } from '../services/interfaces/IProfileService';
import { IUserService } from '../services/interfaces/IUserService';
import { IAchievementService } from '../services/interfaces/IAchievementService';
import { ICertificationService } from '../services/interfaces/ICertificationService';
import { UserProfile } from '@prisma/client';
import { HttpStatusCode } from '../enums/StatusCodes';
import { EducationSchema, ExperienceSchema, UpdateProfileSchema } from '../dto/schemas/profile.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { Messages } from '../constants/Messages';
import cloudinary from '../config/cloudinary';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { RequestWithUser } from '../types/express/RequestWithUser';
import { AppError } from '../utils/errors/AppError';
import { logger } from '../utils/logger';
import { CloudinaryService } from '../services/CloudinaryService';

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.IProfileService) private _profileService: IProfileService,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.IAchievementService) private _achievementService: IAchievementService,
    @inject(TYPES.ICertificationService) private _certificationService: ICertificationService,
    @inject(TYPES.CloudinaryService) private _cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Normalize profile picture URL - ensures we always return a clean public URL
   * Removes signed URL parameters and extracts public URL if needed
   */
  private _normalizeProfilePictureUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // If it's already a clean public URL (image/upload/...), return as is
    if (url.includes('/image/upload/') && !url.includes('/image/authenticated/')) {
      // Clean up any query parameters that might cause issues
      try {
        const urlObj = new URL(url);
        // Keep only the base URL without query params
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch {
        return url.split('?')[0]; // Remove query params if URL parsing fails
      }
    }

    // If it's a signed URL (contains /image/authenticated/), try to extract public URL
    if (url.includes('/image/authenticated/')) {
      try {
        // Try to extract public_id from the URL
        // Signed URLs have pattern: /image/authenticated/s--xxx--/public_id
        const match = url.match(/\/image\/authenticated\/s--[^-]+--\/(.+)$/);
        if (match && match[1]) {
          const publicId = match[1].split('?')[0].split('_a=')[0]; // Remove query params
          // Reconstruct public URL
          return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
        }
      } catch (error) {
        logger.warn('Failed to normalize signed profile picture URL', { url, error });
      }
    }

    // If it's a full Cloudinary URL but malformed, try to extract public_id
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex < pathParts.length - 1) {
        const publicId = pathParts.slice(uploadIndex + 1).join('/').split('?')[0];
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
      }
    } catch {
      // If URL parsing fails, return null to avoid malformed URLs
      logger.warn('Invalid profile picture URL format', { url });
      return null;
    }

    // If we can't normalize it, return null to avoid errors
    return null;
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const validationResult = UpdateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const profileData = validationResult.data;
    const profile = await this._profileService.createProfile(userId, profileData);
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ profile }, Messages.PROFILE.CREATED_SUCCESS)
    );
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const profile = await this._profileService.getProfile(userId);
    
    if (!profile) {
      throw new AppError(Messages.PROFILE.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    
    // Normalize profile picture URL - ensure it's a clean public URL
    if (profile.profilePicture) {
      profile.profilePicture = this._normalizeProfilePictureUrl(profile.profilePicture) || null;
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ profile }, Messages.PROFILE.RETRIEVED_SUCCESS)
    );
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    if (req.body?.name && typeof req.body.name === 'string') {
      await this._userService.updateUserName(userId, req.body.name);
    }
    
    const existingProfile = await this._profileService.getProfile(userId);
    if (!existingProfile) {
      await this._profileService.createProfile(userId, {});
    }

    let profileData: Record<string, unknown> = {
      headline: req.body?.headline || undefined,
      about: req.body?.about || undefined,
      location: req.body?.location || undefined,
      phone: req.body?.phone || undefined,
      skills: req.body?.skills || undefined,
      profilePicture: req.body?.profilePicture || undefined
    };
    if (req.body?.profilePicture) {
      logger.debug('ProfileController: profilePicture starts with data:image/', { 
        startsWithDataImage: req.body.profilePicture.startsWith('data:image/'),
        length: req.body.profilePicture.length 
      });
    }
    
    if (req.body?.profilePicture && typeof req.body.profilePicture === 'string' && req.body.profilePicture.startsWith('data:image/')) {
      try {
        const result = await cloudinary.uploader.upload(req.body.profilePicture, {
          folder: 'user-profiles',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' }
          ],
          resource_type: 'image'
        });
        profileData.profilePicture = result.secure_url;
      } catch (_cloudinaryError) {
        throw new AppError(Messages.PROFILE.IMAGE_UPLOAD_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    } else {
      logger.debug('ProfileController: No valid profile picture data found');
    }
    
    const cleanedProfileData = Object.entries(profileData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    logger.debug('ProfileController: Cleaned profile data:', cleanedProfileData);

    const validationResult = UpdateProfileSchema.safeParse(cleanedProfileData);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const updatedProfile = await this._profileService.updateProfile(userId, validationResult.data);
    
    res.status(HttpStatusCode.OK).json({ 
      success: true,
      data: { profile: updatedProfile },
      message: Messages.PROFILE.UPDATED_SUCCESS
    });
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    await this._profileService.deleteProfile(userId);
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.PROFILE.DELETED_SUCCESS
    });
  }

  async getCurrentProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;
  
    const profile = await this._profileService.getProfile(userId);
    if (!profile) {
      throw new AppError(Messages.PROFILE.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // Normalize profile picture URL - ensure it's a clean public URL
    if (profile.profilePicture) {
      profile.profilePicture = this._normalizeProfilePictureUrl(profile.profilePicture) || null;
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ profile }, Messages.PROFILE.CURRENT_PROFILE_FETCHED_SUCCESS)
    );
  }

  async getFullProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const userData = await this._userService.findById(userId);

    let fullProfile = await this._profileService.getFullProfile(userId);

    if (!fullProfile) {
      await this._profileService.createProfile(userId, {});
      fullProfile = await this._profileService.getFullProfile(userId);
    }
    if (!fullProfile) {
      throw new AppError(Messages.PROFILE.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // Normalize profile picture URL - ensure it's a clean public URL
    if (fullProfile.profilePicture) {
      fullProfile.profilePicture = this._normalizeProfilePictureUrl(fullProfile.profilePicture) || null;
    }

    const achievements = await this._achievementService.getAchievements(userId);
    const certifications = await this._certificationService.getCertifications(userId);

    const completionPercentage = this._calculateCompletionPercentage(fullProfile);
    
    const responseData = {
      profile: {
        ...fullProfile,
        achievements: achievements,
        certifications: certifications,
      },
      user: {
        id: userId,
        username: userData?.username || (req as RequestWithUser).user?.email || '',  
        email: (req as RequestWithUser).user?.email || '',
        isVerified: userData?.isVerified || false,
      },
      completionPercentage,
    };

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, Messages.PROFILE.RETRIEVED_SUCCESS)
    );
  }

  private _calculateCompletionPercentage(profile: (UserProfile & { experience?: unknown[]; education?: unknown[]; certifications?: unknown; achievements?: unknown }) | null): number {
    if (!profile) {
      return 0;
    }

    let score = 0;
    let maxScore = 0;

    const essentialFields = [
      { field: 'headline', weight: 4, required: true },
      { field: 'about', weight: 4, required: true },
      { field: 'location', weight: 4, required: true },
      { field: 'phone', weight: 4, required: true }
    ];

    essentialFields.forEach(({ field, weight }) => {
      const value = profile[field as keyof typeof profile];
      if (value && (typeof value !== 'string' || value.trim().length > 0)) {
        score += weight;
      }
      maxScore += weight;
    });

    if (profile.skills && Array.isArray(profile.skills) && profile.skills.length >= 3) {
      score += 8;
    }
    maxScore += 8;
    if (profile.experience && Array.isArray(profile.experience) && profile.experience.length >= 1) {
      score += 8;
    }
    maxScore += 8;
    if (profile.education && Array.isArray(profile.education) && profile.education.length >= 1) {
      score += 8;
    }
    maxScore += 8;
    if (profile.resume && profile.resume.trim().length > 0) {
      score += 4;
    }
    maxScore += 4;
    if (profile.profilePicture && profile.profilePicture.trim().length > 0) {
      score += 2;
    }
    maxScore += 2;
    if (profile.certifications) {
      try {
        const certifications = typeof profile.certifications === 'string' 
          ? JSON.parse(profile.certifications) 
          : profile.certifications;
        if (Array.isArray(certifications) && certifications.length >= 1) {
          score += 2;
        }
      } catch {
 
      }
    }
    maxScore += 2;

    if (profile.achievements) {
      try {
        const achievements = typeof profile.achievements === 'string' 
          ? JSON.parse(profile.achievements) 
          : profile.achievements;
        if (Array.isArray(achievements) && achievements.length >= 1) {
          score += 2;
        }
      } catch {
       
      }
    }
    maxScore += 2;

    return Math.round((score / maxScore) * 100);
  }

  async addExperience(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const validationResult = ExperienceSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const experienceData = validationResult.data;
    const experience = await this._profileService.addExperience(userId, experienceData);
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ experience }, Messages.EXPERIENCE.ADDED_SUCCESS)
    );
  }

  async updateExperience(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const experienceId = req.params.id;
    if (!experienceId) {
      throw new AppError(Messages.EXPERIENCE.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const validationResult = ExperienceSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const experienceData = validationResult.data;
    const updatedExperience = await this._profileService.updateExperience(
      userId,
      experienceId,
      experienceData
    );
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ experience: updatedExperience }, Messages.EXPERIENCE.UPDATED_SUCCESS)
    );
  }

  async deleteExperience(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const experienceId = req.params.id;
    if (!experienceId) {
      throw new AppError(Messages.EXPERIENCE.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    await this._profileService.deleteExperience(userId, experienceId);
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.EXPERIENCE.DELETED_SUCCESS 
    });
  }

  async addEducation(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const validationResult = EducationSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const educationData = validationResult.data;
    const education = await this._profileService.addEducation(userId, educationData);
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ education }, Messages.EDUCATION.ADDED_SUCCESS)
    );
  }

  async updateEducation(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const educationId = req.params.id;
    if (!educationId) {
      throw new AppError(Messages.EDUCATION.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const validationResult = EducationSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const educationData = validationResult.data;
    const updatedEducation = await this._profileService.updateEducation(
      userId,
      educationId,
      educationData
    );
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ education: updatedEducation }, Messages.EDUCATION.UPDATED_SUCCESS)
    );
  }

  async deleteEducation(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const educationId = req.params.id;
    if (!educationId) {
      throw new AppError(Messages.EDUCATION.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    await this._profileService.deleteEducation(userId, educationId);
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.EDUCATION.DELETED_SUCCESS 
    });
  }
}
