/**
 * Common error and success messages used across the API Gateway
 */
export const CommonMessages = {
    NO_TOKEN_PROVIDED: 'No token provided',
    INVALID_TOKEN: 'Invalid token',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    ACCOUNT_BLOCKED: 'Account blocked',
    SERVICE_UNAVAILABLE: (serviceName: string) => `The ${serviceName} service is currently unavailable`,
    SERVICE_ERROR: (serviceName: string) => `${serviceName} service unavailable`,
    FILE_UPLOAD_FAILED: 'File upload failed',
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    SOMETHING_WENT_WRONG: 'Something went wrong on our end',
    HEALTHY: 'healthy'
  } as const;