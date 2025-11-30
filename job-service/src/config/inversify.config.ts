import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { JobService } from '../services/implementations/JobService';
import { JobRepository } from '../repositories/implementations/JobRepository';
import { IJobRepository } from '../repositories/interfaces/IJobRepository';
import { IJobService } from '../services/interfaces/IJobService';
import { JobController } from '../controllers/JobController';
import { JobReportService } from '../services/implementations/JobReportService';
import { JobReportRepository } from '../repositories/implementations/JobReportRepository';
import { IJobReportRepository } from '../repositories/interfaces/IJobReportRepository';
import { IJobReportService } from '../services/interfaces/IJobReportService';
import { JobReportController } from '../controllers/JobReportController';

const container = new Container();

container.bind<IJobRepository>(TYPES.IJobRepository).to(JobRepository);
container.bind<IJobService>(TYPES.IJobService).to(JobService);
container.bind<JobController>(TYPES.JobController).to(JobController);
container.bind<IJobReportRepository>(TYPES.IJobReportRepository).to(JobReportRepository);
container.bind<IJobReportService>(TYPES.IJobReportService).to(JobReportService);
container.bind<JobReportController>(TYPES.JobReportController).to(JobReportController);

export default container;
