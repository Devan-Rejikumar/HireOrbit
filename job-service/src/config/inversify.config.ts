import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { JobService } from '../services/implementation/JobService';
import { JobRepository } from '../repositories/implementation/JobRepository';
import { IJobRepository } from '../repositories/interface/IJobRepository';
import { IJobService } from '../services/interface/IJobService';
import { JobController } from '../controllers/JobController';

const container = new Container();

container.bind<IJobRepository>(TYPES.IJobRepository).to(JobRepository);
container.bind<IJobService>(TYPES.IJobService).to(JobService);
container.bind<JobController>(TYPES.JobController).to(JobController);

export default container;
