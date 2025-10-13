import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { CompanyRepository } from '../repositories/implementation/CompanyRepository';
import { CompanyService } from '../services/implementation/CompanyService';
import { EmailService } from '../services/implementation/EmailService';
import { RedisService } from '../services/implementation/RedisService';
import { CompanyController } from '../controllers/CompanyController'; 
import { ICompanyRepository } from '../repositories/interface/ICompanyRepository';
import { ICompanyService } from '../services/interface/ICompanyService';
import { IEmailService } from '../services/interface/IEmailService';

const container = new Container();

container.bind<CompanyRepository>(TYPES.CompanyRepository).to(CompanyRepository);
container.bind<CompanyService>(TYPES.CompanyService).to(CompanyService);
container.bind<RedisService>(TYPES.RedisService).to(RedisService).inSingletonScope();
container.bind<CompanyController>(TYPES.CompanyController).to(CompanyController); 
container.bind<ICompanyRepository>(TYPES.ICompanyRepository).to(CompanyRepository);
container.bind<ICompanyService>(TYPES.ICompanyService).to(CompanyService);
container.bind<IEmailService>(TYPES.EmailService).to(EmailService);

export default container;