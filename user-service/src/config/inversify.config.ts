import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';

import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { IAdminRepository } from '../repositories/interfaces/IAdminRepository';
import { IProfileRepository } from '../repositories/interfaces/IProfileRepository';
import { IResumeRepository } from '../repositories/interfaces/IResumeRepository';
import { ICertificationRepository } from '../repositories/interfaces/ICertificationRepository';
import { IAchievementRepository } from '../repositories/interfaces/IAchievementRepository';
import { ICompanyApiRepository } from '../repositories/implementations/CompanyApiRepository';

import { UserRepository } from '../repositories/implementations/UserRepository';
import { AdminRepository } from '../repositories/implementations/AdminRepository';
import { ProfileRepository } from '../repositories/implementations/ProfileRepository';
import { ResumeRepository } from '../repositories/implementations/ResumeRepository';
import { CertificationRepository } from '../repositories/implementations/CertificationRepository';
import { AchievementRepository } from '../repositories/implementations/AchievementRepository';
import { CompanyApiRepository } from '../repositories/implementations/CompanyApiRepository';

// Service Interfaces
import { IUserService } from '../services/interfaces/IUserService';
import { IAdminService } from '../services/interfaces/IAdminService';
import { IProfileService } from '../services/interfaces/IProfileService';
import { IResumeService } from '../services/interfaces/IResumeService';
import { ICertificationService } from '../services/interfaces/ICertificationService';
import { IAchievementService } from '../services/interfaces/IAchievementService';

// Service Implementations
import { UserService } from '../services/implementations/UserService';
import { AdminService } from '../services/implementations/AdminService';
import { ProfileService } from '../services/implementations/ProfileService';
import { ResumeService } from '../services/implementations/ResumeService';
import { CertificationService } from '../services/implementations/CertificationService';
import { AchievementService } from '../services/implementations/AchievementService';
import { RedisService } from '../services/implementations/RedisService';
import { EmailService } from '../services/implementations/EmailService';
import { JWTService } from '../services/implementations/JWTService';

// Controllers
import { UserController } from '../controllers/UserController';
import { AdminController } from '../controllers/AdminController';
import { ProfileController } from '../controllers/ProfileController';
import { ResumeController } from '../controllers/ResumeController';
import { CertificationController } from '../controllers/CertificationController';
import { AchievementController } from '../controllers/AchievementController';


const container = new Container();

container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<IUserService>(TYPES.IUserService).to(UserService);
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<EmailService>(TYPES.EmailService).to(EmailService);
container.bind<RedisService>(TYPES.RedisService).to(RedisService).inSingletonScope();
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AdminRepository>(TYPES.AdminRepository).to(AdminRepository);
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository);
container.bind<AdminService>(TYPES.AdminService).to(AdminService);
container.bind<IAdminService>(TYPES.IAdminService).to(AdminService);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);
container.bind<IProfileRepository>(TYPES.IProfileRepository).to(ProfileRepository);
container.bind<IProfileService>(TYPES.IProfileService).to(ProfileService);
container.bind<ProfileController>(TYPES.ProfileController).to(ProfileController);
container.bind<ICompanyApiRepository>(TYPES.ICompanyApiRepository).to(CompanyApiRepository);
container.bind<JWTService>(TYPES.JWTService).to(JWTService);
container.bind<IResumeRepository>(TYPES.IResumeRepository).to(ResumeRepository);
container.bind<IResumeService>(TYPES.IResumeService).to(ResumeService);
container.bind<ResumeController>(TYPES.ResumeController).to(ResumeController);
container.bind<ICertificationRepository>(TYPES.ICertificationRepository).to(CertificationRepository);
container.bind<ICertificationService>(TYPES.ICertificationService).to(CertificationService);
container.bind<CertificationController>(TYPES.CertificationController).to(CertificationController);
container.bind<IAchievementRepository>(TYPES.IAchievementRepository).to(AchievementRepository);
container.bind<IAchievementService>(TYPES.IAchievementService).to(AchievementService);
container.bind<AchievementController>(TYPES.AchievementController).to(AchievementController);
export default container;