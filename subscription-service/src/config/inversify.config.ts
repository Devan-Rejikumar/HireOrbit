import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';

// Repositories
import { SubscriptionRepository } from '../repositories/implementations/SubscriptionRepository';
import { ISubscriptionRepository } from '../repositories/interfaces/ISubscriptionRepository';
import { SubscriptionPlanRepository } from '../repositories/implementations/SubscriptionPlanRepository';
import { ISubscriptionPlanRepository } from '../repositories/interfaces/ISubscriptionPlanRepository';
import { JobPostingLimitRepository } from '../repositories/implementations/JobPostingLimitRepository';
import { IJobPostingLimitRepository } from '../repositories/interfaces/IJobPostingLimitRepository';

// Services
import { StripeService } from '../services/implementations/StripeService';
import { IStripeService } from '../services/interfaces/IStripeService';
import { SubscriptionService } from '../services/implementations/SubscriptionService';
import { ISubscriptionService } from '../services/interfaces/ISubscriptionService';
import { FeatureService } from '../services/implementations/FeatureService';
import { IFeatureService } from '../services/interfaces/IFeatureService';

// Controllers
import { SubscriptionController } from '../controllers/SubscriptionController';

// Webhooks
import { StripeWebhookHandler } from '../webhooks/stripe.webhook';

const container = new Container();

// Repository bindings
container.bind<ISubscriptionRepository>(TYPES.ISubscriptionRepository).to(SubscriptionRepository);
container.bind<ISubscriptionPlanRepository>(TYPES.ISubscriptionPlanRepository).to(SubscriptionPlanRepository);
container.bind<IJobPostingLimitRepository>(TYPES.IJobPostingLimitRepository).to(JobPostingLimitRepository);

// Service bindings
container.bind<IStripeService>(TYPES.IStripeService).to(StripeService);
container.bind<ISubscriptionService>(TYPES.ISubscriptionService).to(SubscriptionService);
container.bind<IFeatureService>(TYPES.IFeatureService).to(FeatureService);

// Controller bindings
container.bind<SubscriptionController>(TYPES.SubscriptionController).to(SubscriptionController);

// Webhook bindings
container.bind<StripeWebhookHandler>(TYPES.StripeWebhookHandler).to(StripeWebhookHandler);

export default container;

