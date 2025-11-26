import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { HttpStatusCode } from '../enums/StatusCodes';
import { logger } from '../utils/logger';
import { buildErrorResponse } from 'shared-dto';

export const ErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    res.status(err.statusCode).json(buildErrorResponse(err.message));
    return;
  }

  const error = err as Error;
  logger.error(`Unhandled Error: ${error.message}`, {
    error: error.stack,
    path: req.path,
    method: req.method,
  });
  res
    .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
    .json(buildErrorResponse(Messages.ERROR.SOMETHING_WENT_WRONG));
};

