import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { HttpStatusCode } from '../enums/StatusCodes';
import { logger } from '../utils/logger';

export const ErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`);
    res.status(err.statusCode).json({ success: false, error: err.message, message: err.message });
    return;
  }

  const error = err as Error;
  logger.error(` Unhandled Error: ${error.message}`);
  logger.error(` Error stack: ${error.stack}`);
  res
    .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
    .json({ 
      success: false, 
      message: Messages.ERROR.SOMETHING_WENT_WRONG,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

