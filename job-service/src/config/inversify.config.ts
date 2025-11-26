import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { JobService } from '../services/implementations/JobService';
import { JobRepository } from '../repositories/implementations/JobRepository';
import { IJobRepository } from '../repositories/interfaces/IJobRepository';
import { IJobService } from '../services/interfaces/IJobService';
import { JobController } from '../controllers/JobController';

const container = new Container();

container.bind<IJobRepository>(TYPES.IJobRepository).to(JobRepository);
container.bind<IJobService>(TYPES.IJobService).to(JobService);
container.bind<JobController>(TYPES.JobController).to(JobController);

export default container;
