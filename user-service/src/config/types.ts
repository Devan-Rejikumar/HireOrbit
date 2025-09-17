import { JWTService } from '../services/JWTService';

const TYPES = {
  UserService: Symbol.for('UserService'),
  IUserService: Symbol.for('IUserService'),
  UserRepository: Symbol.for('UserRepository'),
  IUserRepository: Symbol.for('IUserRepository'),
  EmailService: Symbol.for('EmailService'),
  UserController: Symbol.for('UserController'),
  AdminRepository: Symbol.for('AdminRepository'),
  IAdminRepository: Symbol.for('IAdminRepository'),
  AdminService: Symbol.for('AdminService'),
  IAdminService: Symbol.for('IAdminService'),
  AdminController: Symbol.for('AdminController'),
  ProfileRepository: Symbol.for('ProfileRepository'),
  IProfileRepository: Symbol.for('IProfileRepository'),
  ProfileService: Symbol.for('ProfileService'),
  IProfileService: Symbol.for('IProfileService'),
  ProfileController: Symbol.for('ProfileController'),
  CompanyApiRepository: Symbol.for('CompanyApiRepository'),
  ICompanyApiRepository: Symbol.for('ICompanyApiRepository'),
  RedisService: Symbol.for('RedisService'),
  JWTService: Symbol.for('JWTService')
};

export default TYPES;