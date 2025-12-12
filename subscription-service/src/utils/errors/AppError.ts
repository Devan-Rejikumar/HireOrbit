export class AppError extends Error {
  constructor(
      public message: string,
      public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}