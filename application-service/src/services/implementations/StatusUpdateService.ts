import { injectable } from 'inversify';
import { ApplicationStatus } from '@prisma/client';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';

@injectable()
export class StatusUpdateService {
  private readonly statusTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    PENDING: ['REVIEWING', 'REJECTED'],
    REVIEWING: ['SHORTLISTED', 'REJECTED', 'PENDING'],
    SHORTLISTED: ['ACCEPTED', 'REJECTED', 'REVIEWING'],
    REJECTED: [],
    ACCEPTED: [], 
    WITHDRAWN: [] 
  };

  validateTransition(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): boolean {
    const allowedTransitions = this.statusTransitions[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  getAvailableTransitions(currentStatus: ApplicationStatus): ApplicationStatus[] {
    return this.statusTransitions[currentStatus] || [];
  }

  validateOrThrow(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    if (!this.validateTransition(currentStatus, newStatus)) {
      const allowed = this.getAvailableTransitions(currentStatus);
      throw new AppError(
        `Invalid status transition: Cannot change from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'None (final state)'}`,
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  isFinalStatus(status: ApplicationStatus): boolean {
    return this.statusTransitions[status].length === 0;
  }
}

