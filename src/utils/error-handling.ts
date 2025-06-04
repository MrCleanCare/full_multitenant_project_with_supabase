export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    };
  }

  // Handle unknown errors
  console.error('Unexpected error:', error);
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    isOperational: false,
  };
};

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const createError = (message: string, statusCode = 500) => {
  return new AppError(message, statusCode);
}; 