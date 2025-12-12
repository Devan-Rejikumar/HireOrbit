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
import { buildSuccessResponse } from 'shared-dto';
import { Messages } from '../constants/Messages';
import cloudinary from '../config/cloudinary';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { RequestWithUser } from '../types/express/RequestWithUser';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.IProfileService) private _profileService: IProfileService,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.IAchievementService) private _achievementService: IAchievementService,
    @inject(TYPES.ICertificationService) private _certificationService: ICertificationService
  ) {}

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

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ profile }, Messages.PROFILE.RETRIEVED_SUCCESS)
    );
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    if (req.body?.name && typeof req.body.name === 'string') {
      console.log(' Updating User name:', req.body.name);
      await this._userService.updateUserName(userId, req.body.name);
      console.log('User name updated successfully');
    }
    
    const existingProfile = await this._profileService.getProfile(userId);
    if (!existingProfile) {
      console.log(' No existing profile found, creating new one');
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
      console.log('ProfileController] profilePicture starts with data:image/:', req.body.profilePicture.startsWith('data:image/'));
      console.log('ProfileController] profilePicture length:', req.body.profilePicture.length);
    }
    
    if (req.body?.profilePicture && typeof req.body.profilePicture === 'string' && req.body.profilePicture.startsWith('data:image/')) {
      console.log('ProfileController] Processing profile picture upload to Cloudinary...');
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
        console.log('ProfileController] Cloudinary upload successful:', result.secure_url);
      } catch (cloudinaryError) {
        console.error('ProfileController] Cloudinary upload error:', cloudinaryError);
        throw new AppError(Messages.PROFILE.IMAGE_UPLOAD_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    } else {
      console.log(' [ProfileController] No valid profile picture data found');
    }
    
    const cleanedProfileData = Object.entries(profileData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    console.log(' ProfileController: Cleaned profile data:', JSON.stringify(cleanedProfileData, null, 2));

    const validationResult = UpdateProfileSchema.safeParse(cleanedProfileData);
    if (!validationResult.success) {
      console.log(' Validation failed:', validationResult.error);
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const updatedProfile = await this._profileService.updateProfile(userId, validationResult.data);
    console.log(' Profile updated successfully:', JSON.stringify(updatedProfile, null, 2));
    
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
        // Ignore parse errors
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
        // Ignore parse errors
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