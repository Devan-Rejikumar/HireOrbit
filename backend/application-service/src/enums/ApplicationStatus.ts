/**
 * Application Status Enum
 * Defines all possible statuses for job applications
 */
export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * Type guard to check if a string is a valid ApplicationStatus
 */
export function isApplicationStatus(status: string): status is ApplicationStatus {
  return Object.values(ApplicationStatus).includes(status as ApplicationStatus);
}

