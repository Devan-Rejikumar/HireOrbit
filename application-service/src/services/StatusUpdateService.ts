import { injectable } from 'inversify';
import { ApplicationStatus } from '@prisma/client';

/**
 * StatusUpdateService
 * 
 * Single Responsibility: Handles all status transition logic
 * - Validates if a status change is allowed
 * - Defines business rules for status workflow
 * - Returns available next statuses
 */
@injectable()
export class StatusUpdateService {
  
  // Define allowed status transitions (Business Rules)
  private readonly statusTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    PENDING: ['REVIEWING', 'REJECTED'],
    REVIEWING: ['SHORTLISTED', 'REJECTED', 'PENDING'],
    SHORTLISTED: ['ACCEPTED', 'REJECTED', 'REVIEWING'],
    REJECTED: [], // Final state - cannot change
    ACCEPTED: [], // Final state - cannot change
    WITHDRAWN: [] // Final state - cannot change
  };

  /**
   * Validate if transition from currentStatus to newStatus is allowed
   * @param currentStatus - Current application status
   * @param newStatus - Desired new status
   * @returns true if transition is valid, false otherwise
   */
  validateTransition(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): boolean {
    const allowedTransitions = this.statusTransitions[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get list of statuses that can be transitioned to from current status
   * @param currentStatus - Current application status
   * @returns Array of allowed next statuses
   */
  getAvailableTransitions(currentStatus: ApplicationStatus): ApplicationStatus[] {
    return this.statusTransitions[currentStatus] || [];
  }

  /**
   * Validate status transition and throw descriptive error if invalid
   * @param currentStatus - Current status
   * @param newStatus - Desired new status
   * @throws Error with descriptive message if transition is invalid
   */
  validateOrThrow(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    if (!this.validateTransition(currentStatus, newStatus)) {
      const allowed = this.getAvailableTransitions(currentStatus);
      throw new Error(
        `Invalid status transition: Cannot change from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'None (final state)'}`
      );
    }
  }

  /**
   * Check if a status is a final state (no further transitions allowed)
   * @param status - Status to check
   * @returns true if status is final (ACCEPTED, REJECTED, WITHDRAWN)
   */
  isFinalStatus(status: ApplicationStatus): boolean {
    return this.statusTransitions[status].length === 0;
  }
}

