import { HttpStatusCode } from '../../enums/StatusCodes';

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

