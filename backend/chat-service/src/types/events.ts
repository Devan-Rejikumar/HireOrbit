/**
 * Event data types for chat service
 * These interfaces define the structure of event data received from Kafka
 */

export interface StatusUpdatedEventData {
  applicationId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
  updatedAt: Date;
}

