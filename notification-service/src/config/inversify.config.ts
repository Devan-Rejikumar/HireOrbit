import { Container } from 'inversify';
import { INotificationRepository } from '../repositories/interfaces/INotificationRepository';
import { NotificationRepository } from '../repositories/implementations/NotificationRepository';
import { INotificationService } from '../services/interfaces/INotificationService';
import { NotificationService } from '../services/implementations/NotificationService';
import { IEventService } from '../services/interfaces/IEventService';
import { EventService } from '../services/implementations/EventService';
import { NotificationModel } from '../models/NotificationModel';
import { TYPES } from './types';

const container = new Container();
container.bind<INotificationRepository>(TYPES.INotificationRepository).to(NotificationRepository).inSingletonScope();
container.bind<INotificationService>(TYPES.INotificationService).to(NotificationService).inSingletonScope();
container.bind<IEventService>(TYPES.IEventService).to(EventService).inSingletonScope();
container.bind(TYPES.NotificationModel).toConstantValue(NotificationModel);
export { container };