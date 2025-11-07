import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IProfileService } from '../services/interfaces/IProfileService';
import { IUserService } from '../services/interfaces/IUserService';
import { IAchievementService } from '../services/interfaces/IAchievementService';
import { ICertificationService } from '../services/interfaces/ICertificationService';
import { UserProfile } from '@prisma/client';
import { HttpStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { EducationSchema, ExperienceSchema, UpdateProfileSchema } from '../dto/schemas/profile.schema';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import cloudinary from '../config/cloudinary';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType: string;
    companyName?: string;
  };
}

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.IProfileService) private _profileService: IProfileService,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.IAchievementService) private _achievementService: IAchievementService,
    @inject(TYPES.ICertificationService) private _certificationService: ICertificationService
  ) {}

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }
      const validationResult = UpdateProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const profileData = validationResult.data;
      const profile = await this._profileService.createProfile(userId, profileData);
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ profile }, 'Profile created successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Profile already exists') {
        res.status(HttpStatusCode.CONFLICT).json(
          buildErrorResponse(errorMessage)
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage)
        );
      }
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId;
  
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }
  
      const profile = await this._profileService.getProfile(userId);
      
      if (!profile) {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('Profile not found')
        );
        return;
      }
  
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ profile }, 'Profile retrieved successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage)
      );
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {

      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'User not authenticated' });
        return;
      }

      if (req.body?.name && typeof req.body.name === 'string') {
        console.log(' Updating User name:', req.body.name);
        try {
          await this._userService.updateUserName(userId, req.body.name);
          console.log('User name updated successfully');
        } catch (error) {
          console.error('Error updating user name:', error);
          res.status(HttpStatusCode.BAD_REQUEST).json(
            buildErrorResponse('Failed to update user name', 'Name update failed')
          );
          return;
        }
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
          res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
            buildErrorResponse('Failed to upload image to Cloudinary', 'Image upload failed')
          );
          return;
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
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }

      const updatedProfile = await this._profileService.updateProfile(userId, validationResult.data);
      console.log(' Profile updated successfully:', JSON.stringify(updatedProfile, null, 2));
      
      res.status(HttpStatusCode.OK).json({ 
        success: true,
        data: { profile: updatedProfile },
        message: 'Profile updated successfully'
      });
    } catch (error: unknown) {
      console.error(' ProfileController error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'Profile not found') {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: errorMessage });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: errorMessage });
      }
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'User not authenticated' });
        return;
      }

      await this._profileService.deleteProfile(userId);
      res.status(HttpStatusCode.OK).json({ message: 'Profile deleted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Profile not found') {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: errorMessage });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: errorMessage });
      }
    }
  }

async getFullProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'User not authenticated' });
      return;
    }
    const userData = await this._userService.findById(userId);

    let fullProfile = await this._profileService.getFullProfile(userId);

    if (!fullProfile) {
      const emptyProfile = await this._profileService.createProfile(userId, {});
      fullProfile = await this._profileService.getFullProfile(userId);
    }
    if (!fullProfile) {
      res.status(HttpStatusCode.NOT_FOUND).json({ error: 'Profile not found' });
      return;
    }

    const achievements = await this._achievementService.getAchievements(userId);
    const certifications = await this._certificationService.getCertifications(userId);

    const completionPercentage = this.calculateCompletionPercentage(fullProfile);
    
    const responseData = {
      profile: {
        ...fullProfile,
        achievements: achievements,
        certifications: certifications,
      },
      user: {
        id: userId,
        username: userData?.username || req.headers['x-user-email'] as string,  
        email: req.headers['x-user-email'] as string,
        isVerified: userData?.isVerified || false,
      },
      completionPercentage,
    };

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, 'Full profile retrieved successfully')
    );
  } catch (error) {
    console.error('Error in getFullProfile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
      buildErrorResponse(errorMessage, 'Failed to retrieve full profile')
    );
  }
}

 private calculateCompletionPercentage(profile: (UserProfile & { experience?: unknown[]; education?: unknown[]; certifications?: any; achievements?: any }) | null): number {
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

  essentialFields.forEach(({ field, weight, required }) => {
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
    } catch (error) {
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
    } catch (error) {
      
    }
  }
  maxScore += 2;

  return Math.round((score / maxScore) * 100);
}


  async addExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }

      const validationResult = ExperienceSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const experienceData = validationResult.data;
      const experience = await this._profileService.addExperience(userId, experienceData);
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ experience }, 'Experience added successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Profile not found') {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('Profile not found. Please create a profile first.')
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage)
        );
      }
    }
  }

  async updateExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const experienceId = req.params.id;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }
  
      if (!experienceId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Experience ID is required')
        );
        return;
      }
  
      const validationResult = ExperienceSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const experienceData = validationResult.data;
      const updatedExperience = await this._profileService.updateExperience(
        userId,
        experienceId,
        experienceData
      );
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ experience: updatedExperience }, 'Experience updated successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Experience not found') {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse(errorMessage)
        );
      } else if (errorMessage === 'Unauthorized') {
        res.status(HttpStatusCode.FORBIDDEN).json(
          buildErrorResponse('You can only update your own experience')
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage)
        );
      }
    }
  }

  async deleteExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const experienceId = req.params.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'User not authenticated' });
        return;
      }

      if (!experienceId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: 'Experience ID is required' 
        });
        return;
      }

      await this._profileService.deleteExperience(userId, experienceId);
      res.status(HttpStatusCode.OK).json({ message: 'Experience deleted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Experience not found') {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: errorMessage });
      } else if (errorMessage === 'Unauthorized') {
        res.status(HttpStatusCode.FORBIDDEN).json({ error: 'You can only delete your own experience' });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: errorMessage });
      }
    }
  }

  async addEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      if (!userId) {
        console.log('ProfileController] No userId found');
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }
  
      const validationResult = EducationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const educationData = validationResult.data;
      const education = await this._profileService.addEducation(userId, educationData);
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ education }, 'Education added successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Profile not found') {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('Profile not found. Please create a profile first.')
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage)
        );
      }
    }
  }

  async updateEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const educationId = req.params.id;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }
  
      if (!educationId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Education ID is required')
        );
        return;
      }
  
      const validationResult = EducationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const educationData = validationResult.data;
      const updatedEducation = await this._profileService.updateEducation(
        userId,
        educationId,
        educationData
      );
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ education: updatedEducation }, 'Education updated successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Education not found') {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse(errorMessage)
        );
      } else if (errorMessage === 'Unauthorized') {
        res.status(HttpStatusCode.FORBIDDEN).json(
          buildErrorResponse('You can only update your own education')
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage)
        );
      }
    }
  }

  async deleteEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const educationId = req.params.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'User not authenticated' });
        return;
      }

      if (!educationId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: 'Education ID is required' 
        });
        return;
      }

      await this._profileService.deleteEducation(userId, educationId);
      res.status(HttpStatusCode.OK).json({ message: 'Education deleted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Education not found') {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: errorMessage });
      } else if (errorMessage === 'Unauthorized') {
        res.status(HttpStatusCode.FORBIDDEN).json({ error: 'You can only delete your own education' });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: errorMessage });
      }
    }
  }
}