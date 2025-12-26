import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';

import { SubscriptionRepository } from '../repositories/implementations/SubscriptionRepository';
import { ISubscriptionRepository } from '../repositories/interfaces/ISubscriptionRepository';
import { SubscriptionPlanRepository } from '../repositories/implementations/SubscriptionPlanRepository';
import { ISubscriptionPlanRepository } from '../repositories/interfaces/ISubscriptionPlanRepository';
import { JobPostingLimitRepository } from '../repositories/implementations/JobPostingLimitRepository';
import { IJobPostingLimitRepository } from '../repositories/interfaces/IJobPostingLimitRepository';
import { TransactionRepository } from '../repositories/implementations/TransactionRepository';
import { ITransactionRepository } from '../repositories/interfaces/ITransactionRepository';
import { StripeService } from '../services/implementations/StripeService';
import { IStripeService } from '../services/interfaces/IStripeService';
import { SubscriptionService } from '../services/implementations/SubscriptionService';
import { ISubscriptionService } from '../services/interfaces/ISubscriptionService';
import { FeatureService } from '../services/implementations/FeatureService';
import { IFeatureService } from '../services/interfaces/IFeatureService';
import { AdminSubscriptionService } from '../services/implementations/AdminSubscriptionService';
import { IAdminSubscriptionService } from '../services/interfaces/IAdminSubscriptionService';
import { RevenueService } from '../services/implementations/RevenueService';
import { IRevenueService } from '../services/interfaces/IRevenueService';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { AdminSubscriptionController } from '../controllers/AdminSubscriptionController';
import { AdminRevenueController } from '../controllers/AdminRevenueController';

import { StripeWebhookHandler } from '../webhooks/stripe.webhook';

const container = new Container();
container.bind<ISubscriptionRepository>(TYPES.ISubscriptionRepository).to(SubscriptionRepository);
container.bind<ISubscriptionPlanRepository>(TYPES.ISubscriptionPlanRepository).to(SubscriptionPlanRepository);
container.bind<ITransactionRepository>(TYPES.ITransactionRepository).to(TransactionRepository);
container.bind<IJobPostingLimitRepository>(TYPES.IJobPostingLimitRepository).to(JobPostingLimitRepository);
container.bind<IStripeService>(TYPES.IStripeService).to(StripeService);
container.bind<ISubscriptionService>(TYPES.ISubscriptionService).to(SubscriptionService);
container.bind<IFeatureService>(TYPES.IFeatureService).to(FeatureService);
container.bind<IAdminSubscriptionService>(TYPES.IAdminSubscriptionService).to(AdminSubscriptionService);
container.bind<IRevenueService>(TYPES.IRevenueService).to(RevenueService);
container.bind<SubscriptionController>(TYPES.SubscriptionController).to(SubscriptionController);
container.bind<AdminSubscriptionController>(TYPES.AdminSubscriptionController).to(AdminSubscriptionController);
container.bind<AdminRevenueController>(TYPES.AdminRevenueController).to(AdminRevenueController);
container.bind<StripeWebhookHandler>(TYPES.StripeWebhookHandler).to(StripeWebhookHandler);

export default container;

