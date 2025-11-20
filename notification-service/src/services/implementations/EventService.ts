import { injectable, inject } from 'inversify';
import { IEventService } from '../interfaces/IEventService';
import { INotificationService } from '../interfaces/INotificationService';
import { consumer } from '../../config/kafka.config';
import { TYPES } from '../../config/types';
import { 
  ApplicationReceivedInput, 
  StatusUpdatedInput, 
  ApplicationWithdrawnInput,
  InterviewConfirmedInput
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

interface InterviewConfirmedEventData {
  userId: string;
  interviewId: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date | string;
  type?: string;
  location?: string;
  meetingLink?: string;
  confirmedBy: string;
  confirmedAt: Date;
}

@injectable()
export class EventService implements IEventService {
  private isConnected = false;
  private isRunning = false;
  private handlers: Map<string, (data: any) => Promise<void>> = new Map();
  private topics: string[] = [];

  constructor(
    @inject(TYPES.INotificationService) private _notificationService: INotificationService
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
      this.isRunning = false;
      this.handlers.clear();
      this.topics = [];
      console.log('Event Service disconnected from Kafka');
    }
  }

  async subscribe<T>(eventType: string, handler: (data: T) => Promise<void>): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cannot subscribe to topics after consumer has started running');
    }
    
    this.handlers.set(eventType, handler);
    
    if (!this.topics.includes(eventType)) {
      this.topics.push(eventType);
    }
  }

  async startConsumer(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    if (this.topics.length === 0) {
      console.warn('No topics to subscribe to');
      return;
    }

    await consumer.subscribe({ topics: this.topics });
    console.log(`Subscribed to topics: ${this.topics.join(', ')}`);

    this.isRunning = true;
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const handler = this.handlers.get(topic);
          if (handler) {
            const data = JSON.parse(message.value?.toString() || '{}');
            await handler(data);
          } else {
            console.warn(`No handler found for topic: ${topic}`);
          }
        } catch (error) {
          console.error(`Error processing ${topic} event:`, error);
        }
      }
    });
  }

  async handleApplicationCreated(data: ApplicationCreatedEventData): Promise<void> {
    const input: ApplicationReceivedInput = {
      companyId: data.companyId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      applicantName: data.applicantName || 'Unknown',
      jobTitle: data.jobTitle || 'Unknown Job'
    };
    
    await this._notificationService.sendApplicationReceivedNotification(input);
  }

  async handleStatusUpdated(data: StatusUpdatedEventData): Promise<void> {
    const input: StatusUpdatedInput = {
      userId: data.userId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus
    };
    
    await this._notificationService.sendStatusUpdatedNotification(input);
  }

  async handleApplicationWithdrawn(data: ApplicationWithdrawnEventData): Promise<void> {
    const input: ApplicationWithdrawnInput = {
      companyId: data.companyId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      applicantName: data.applicantName || 'Unknown',
      jobTitle: data.jobTitle || 'Unknown Job'
    };
    
    await this._notificationService.sendApplicationWithdrawnNotification(input);
  }

  async handleInterviewConfirmed(data: InterviewConfirmedEventData): Promise<void> {
    const input: InterviewConfirmedInput = {
      userId: data.userId,
      interviewId: data.interviewId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      scheduledAt: data.scheduledAt,
      type: data.type,
      location: data.location,
      meetingLink: data.meetingLink
    };
    
    await this._notificationService.sendInterviewConfirmedNotification(input);
  }
}