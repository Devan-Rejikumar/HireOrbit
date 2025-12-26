import { injectable, inject } from 'inversify';
import { IEventService } from '../interfaces/IEventService';
import { INotificationService } from '../interfaces/INotificationService';
import { consumer } from '../../config/kafka.config';
import { TYPES } from '../../config/types';
import { logger } from '../../utils/logger';
import { 
  ApplicationReceivedInput, 
  StatusUpdatedInput, 
  ApplicationWithdrawnInput,
  InterviewConfirmedInput,
  InterviewDecisionInput,
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

interface InterviewDecisionEventData {
  userId: string;
  interviewId: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  decision: string;
  decisionReason?: string;
  feedback?: string;
  decidedBy: string;
  decidedAt: Date;
}

@injectable()
export class EventService implements IEventService {
  private isConnected = false;
  private isRunning = false;
  private handlers: Map<string, (data: unknown) => Promise<void>> = new Map();
  private topics: string[] = [];

  constructor(
    @inject(TYPES.INotificationService) private _notificationService: INotificationService,
  ) {}

  async start(): Promise<void> {
    if (!this.isConnected) {
      await consumer.connect();
      this.isConnected = true;
      logger.info('Event Service connected to Kafka');
    }
  }

  async stop(): Promise<void> {
    if (this.isConnected) {
      await consumer.disconnect();
      this.isConnected = false;
      this.isRunning = false;
      this.handlers.clear();
      this.topics = [];
      logger.info('Event Service disconnected from Kafka');
    }
  }

  async subscribe<T>(eventType: string, handler: (data: T) => Promise<void>): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cannot subscribe to topics after consumer has started running');
    }
    
    // Type assertion is safe because T extends unknown, and handler will receive unknown from JSON.parse
    this.handlers.set(eventType, handler as (data: unknown) => Promise<void>);
    
    if (!this.topics.includes(eventType)) {
      this.topics.push(eventType);
    }
  }

  async startConsumer(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Consumer is already running');
      return;
    }

    if (this.topics.length === 0) {
      logger.warn('No topics to subscribe to');
      return;
    }

    try {
      await consumer.subscribe({ topics: this.topics, fromBeginning: false });
      logger.info(`Subscribed to topics: ${this.topics.join(', ')}`);

      this.isRunning = true;
      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            logger.info(`Received message from topic: ${topic}`);
            const handler = this.handlers.get(topic);
            if (handler) {
              const data = JSON.parse(message.value?.toString() || '{}');
              logger.info(`Processing ${topic} event:`, data);
              await handler(data);
            } else {
              logger.warn(`No handler found for topic: ${topic}`);
            }
          } catch (error) {
            logger.error(`Error processing ${topic} event:`, error);
          }
        },
      });
      logger.info('Consumer started successfully');
    } catch (error) {
      logger.error('Failed to start consumer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async handleApplicationCreated(data: ApplicationCreatedEventData): Promise<void> {
    const input: ApplicationReceivedInput = {
      companyId: data.companyId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      applicantName: data.applicantName || 'Unknown',
      jobTitle: data.jobTitle || 'Unknown Job',
    };
    
    await this._notificationService.sendApplicationReceivedNotification(input);
  }

  async handleStatusUpdated(data: StatusUpdatedEventData): Promise<void> {
    const input: StatusUpdatedInput = {
      userId: data.userId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
    };
    
    await this._notificationService.sendStatusUpdatedNotification(input);
  }

  async handleApplicationWithdrawn(data: ApplicationWithdrawnEventData): Promise<void> {
    const input: ApplicationWithdrawnInput = {
      companyId: data.companyId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      applicantName: data.applicantName || 'Unknown',
      jobTitle: data.jobTitle || 'Unknown Job',
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
      meetingLink: data.meetingLink,
    };
    
    await this._notificationService.sendInterviewConfirmedNotification(input);
  }

  async handleInterviewDecision(data: InterviewDecisionEventData): Promise<void> {
    const input: InterviewDecisionInput = {
      userId: data.userId,
      interviewId: data.interviewId,
      applicationId: data.applicationId,
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      decision: data.decision,
      decisionReason: data.decisionReason,
      feedback: data.feedback,
    };
    
    await this._notificationService.sendInterviewDecisionNotification(input);
  }
}