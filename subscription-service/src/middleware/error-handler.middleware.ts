import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/AppError';
// Logger removed - using console.log instead
import { buildErrorResponse } from 'shared-dto';

export const ErrorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json(buildErrorResponse(err.message, err.message));
    return;
  }

  res.status(500).json(buildErrorResponse('Internal server error', 'An unexpected error occurred'));
};