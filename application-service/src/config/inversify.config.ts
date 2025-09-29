import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IApplicationRepository } from '../repositories/IApplicationRepository';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { IApplicationService } from '../services/IApplicationService';
import { ApplicationService } from '../services/ApplicationService';
import { IEventService } from '../services/IEventService';
import { KafkaEventService } from '../services/KafkaEventService';
import { ApplicationController } from '../controllers/ApplicationController';
import {TYPES} from './types';

const container = new Container();

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:devan@localhost:5432/application_service_db";

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
container.bind<IApplicationRepository>(TYPES.IApplicationRepository).to(ApplicationRepository);
container.bind<IApplicationService>(TYPES.IApplicationService).to(ApplicationService);
container.bind<IEventService>(TYPES.IEventService).to(KafkaEventService);
container.bind<ApplicationController>(TYPES.ApplicationController).to(ApplicationController);

export { container };