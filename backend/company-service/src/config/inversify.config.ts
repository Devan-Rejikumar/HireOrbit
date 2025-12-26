import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { CompanyRepository } from '../repositories/implementations/CompanyRepository';
import { CompanyService } from '../services/implementations/CompanyService';
import { EmailService } from '../services/implementations/EmailService';
import { RedisService } from '../services/implementations/RedisService';
import { CompanyAuthController } from '../controllers/CompanyAuthController';
import { CompanyProfileController } from '../controllers/CompanyProfileController';
import { CompanyAdminController } from '../controllers/CompanyAdminController';
import { CookieService } from '../services/implementations/CookieService';
import { ICompanyRepository } from '../repositories/interfaces/ICompanyRepository';
import { ICompanyService } from '../services/interfaces/ICompanyService';
import { IEmailService } from '../services/interfaces/IEmailService';
import { IndustryCategoryRepository } from '../repositories/implementations/IndustryCategoryRepository';
import { IndustryCategoryService } from '../services/implementations/IndustryCategoryService';
import { IndustryCategoryController } from '../controllers/IndustryCategoryController';
import { IIndustryCategoryRepository } from '../repositories/interfaces/IIndustryCategoryRepository';
import { IIndustryCategoryService } from '../services/interfaces/IIndustryCategoryService';

const container = new Container();

container.bind<CompanyRepository>(TYPES.CompanyRepository).to(CompanyRepository);
container.bind<CompanyService>(TYPES.CompanyService).to(CompanyService);
container.bind<RedisService>(TYPES.RedisService).to(RedisService).inSingletonScope();
container.bind<CompanyAuthController>(TYPES.CompanyAuthController).to(CompanyAuthController);
container.bind<CompanyProfileController>(TYPES.CompanyProfileController).to(CompanyProfileController);
container.bind<CompanyAdminController>(TYPES.CompanyAdminController).to(CompanyAdminController);
container.bind<CookieService>(TYPES.CookieService).to(CookieService);
container.bind<ICompanyRepository>(TYPES.ICompanyRepository).to(CompanyRepository);
container.bind<ICompanyService>(TYPES.ICompanyService).to(CompanyService);
container.bind<IEmailService>(TYPES.EmailService).to(EmailService);

// Industry Category bindings
container.bind<IIndustryCategoryRepository>(TYPES.IIndustryCategoryRepository).to(IndustryCategoryRepository);
container.bind<IIndustryCategoryService>(TYPES.IIndustryCategoryService).to(IndustryCategoryService);
container.bind<IndustryCategoryController>(TYPES.IndustryCategoryController).to(IndustryCategoryController);

export default container;