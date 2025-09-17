export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export function buildSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function buildErrorResponse(error: string, message?: string): ApiResponse<never> {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
  };
}

export function buildListResponse<T>(data: T[], message?: string): ApiResponse<T[]> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function buildPaginatedResponse<T>(
  data: T[], 
  page: number, 
  limit: number, 
  total: number,
  message?: string
): ApiResponse<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  return {
    success: true,
    data: {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    },
    message,
    timestamp: new Date().toISOString()
  };
}