import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { JobService } from '../services/JobService';
import { JobRepository } from '../repositories/JobRepository';
import { IJobRepository } from '../repositories/IJobRepository';
import { IJobService } from '../services/IJobService';
import { JobController } from '../controllers/JobController';

const container = new Container();

container.bind<IJobRepository>(TYPES.IJobRepository).to(JobRepository);
container.bind<IJobService>(TYPES.IJobService).to(JobService);
container.bind<JobController>(TYPES.JobController).to(JobController);

export default container;
