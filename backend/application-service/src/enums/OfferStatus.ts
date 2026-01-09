/**
 * Offer Status Enum
 * Defines all possible statuses for offer letters
 */
export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Type guard to check if a string is a valid OfferStatus
 */
export function isOfferStatus(status: string): status is OfferStatus {
  return Object.values(OfferStatus).includes(status as OfferStatus);
}

