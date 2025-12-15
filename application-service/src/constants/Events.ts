export const Events = {
  APPLICATION: {
    CREATED: 'application.created',
    WITHDRAWN: 'application.withdrawn',
    STATUS_UPDATED: 'application.status_updated',
    BULK_STATUS_UPDATED: 'application.bulk_status_updated',
  },
  INTERVIEW: {
    CONFIRMED: 'interview.confirmed',
    DECISION_MADE: 'interview.decision_made',
  },
} as const;
