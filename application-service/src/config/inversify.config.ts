import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IApplicationRepository } from '../repositories/interfaces/IApplicationRepository';
import { ApplicationRepository } from '../repositories/implementations/ApplicationRepository';
import { IApplicationService } from '../services/interfaces/IApplicationService';
import { ApplicationService } from '../services/implementations/ApplicationService';
import { IEventService } from '../services/interfaces/IEventService';
import { KafkaEventService } from '../services/implementations/KafkaEventService';
import { StatusUpdateService } from '../services/implementations/StatusUpdateService';
import { ApplicationController } from '../controllers/ApplicationController';
import { IInterviewRepository } from '../repositories/interfaces/IInterviewRepository';
import { InterviewRepository } from '../repositories/implementations/InterviewRepository';
import { IInterviewService } from '../services/interfaces/IInterviewService';
import { InterviewService } from '../services/implementations/InterviewService';
import { InterviewController } from '../controllers/InterviewController';
import { IUserServiceClient } from '../services/interfaces/IUserServiceClient';
import { UserServiceClient } from '../services/implementations/UserServiceClient';
import { IJobServiceClient } from '../services/interfaces/IJobServiceClient';
import { JobServiceClient } from '../services/implementations/JobServiceClient';
import {TYPES} from './types';

const container = new Container();

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:devan@localhost:5432/application_service_db";

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
container.bind<IApplicationRepository>(TYPES.IApplicationRepository).to(ApplicationRepository);
container.bind<IApplicationService>(TYPES.IApplicationService).to(ApplicationService);
container.bind<IEventService>(TYPES.IEventService).to(KafkaEventService);
container.bind<StatusUpdateService>(TYPES.StatusUpdateService).to(StatusUpdateService);
container.bind<ApplicationController>(TYPES.ApplicationController).to(ApplicationController);
container.bind<IInterviewRepository>(TYPES.IInterviewRepository).to(InterviewRepository);
container.bind<IInterviewService>(TYPES.IInterviewService).to(InterviewService);
container.bind<InterviewController>(TYPES.InterviewController).to(InterviewController);
container.bind<IUserServiceClient>(TYPES.IUserServiceClient).to(UserServiceClient);
container.bind<IJobServiceClient>(TYPES.IJobServiceClient).to(JobServiceClient);


export { container };