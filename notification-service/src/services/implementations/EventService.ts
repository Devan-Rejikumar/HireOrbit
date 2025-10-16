import { injectable, inject } from 'inversify';
import { IEventService } from '../interfaces/IEventService';
import { INotificationService } from '../interfaces/INotificationService';
import { consumer } from '../../config/kafka.config';
import { TYPES } from '../../config/types';
import { 
  ApplicationReceivedInput, 
  StatusUpdatedInput, 
  ApplicationWithdrawnInput 
} from '../../dto/mappers/notification.mapper';

interface ApplicationCreatedEventData {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName?: string;
  jobTitle?: string;
}

interface StatusUpdatedEventData {
  userId: string;
  applicationId: string;
  jobId: string;
  oldStatus: string;
  newStatus: string;
}

interface ApplicationWithdrawnEventData {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName?: string;
  jobTitle?: string;
}

@injectable()
export class EventService implements IEventService {
  private isConnected = false;
  private isRunning = false;

  constructor(
    @inject(TYPES.INotificationService) private notificationService: INotificationService
  ) {}

  async start(): Promise<void> {
    if (!this.isConnected) {
      await consumer.connect();
      this.isConnected = true;
      console.log('Event Service connected to Kafka');
    }
  }

  async stop(): Promise<void> {
    if (this.isConnected) {
      await consumer.disconnect();
      this.isConnected = false;
      console.log('Event Service disconnected from Kafka');
    }
  }

  async subscribe<T>(eventType: string, handler: (data: T) => Promise<void>): Promise<void> {
    await consumer.subscribe({ topic: eventType });
    if (!this.isRunning) {
      this.isRunning = true;
      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            if (topic === eventType) {
              const data = JSON.parse(message.value?.toString() || '{}') as T;
              await handler(data);
            }
          } catch (error) {
            console.error(`Error processing ${topic} event:`, error);
          }
        }
      });
    }
  }

  async handleApplicationCreated(data: ApplicationCreatedEventData): Promise<void> {
    const input: ApplicationReceivedInput = {
      companyId: data.companyId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      applicantName: data.applicantName || 'Unknown',
      jobTitle: data.jobTitle || 'Unknown Job'
    };
    
    await this.notificationService.sendApplicationReceivedNotification(input);
  }

  async handleStatusUpdated(data: StatusUpdatedEventData): Promise<void> {
    const input: StatusUpdatedInput = {
      userId: data.userId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus
    };
    
    await this.notificationService.sendStatusUpdatedNotification(input);
  }

  async handleApplicationWithdrawn(data: ApplicationWithdrawnEventData): Promise<void> {
    const input: ApplicationWithdrawnInput = {
      companyId: data.companyId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      applicantName: data.applicantName || 'Unknown',
      jobTitle: data.jobTitle || 'Unknown Job'
    };
    
    await this.notificationService.sendApplicationWithdrawnNotification(input);
  }
}