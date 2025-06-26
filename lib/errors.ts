import { Logger } from './logger';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 401, context);
    this.name = 'AuthError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 500, context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export const ErrorHandler = {
  handle: (error: unknown, context?: Record<string, any>): AppError => {
    if (error instanceof AppError) {
      Logger.error(`${error.name}: ${error.message}`, error, { ...error.context, ...context });
      return error;
    }

    if (error instanceof Error) {
      const appError = new AppError(error.message, 'GENERIC_ERROR', 500, context);
      Logger.error(`Unhandled Error: ${error.message}`, error, context);
      return appError;
    }

    const appError = new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500, context);
    Logger.error('Unknown Error', error, context);
    return appError;
  },

  auth: (error: unknown, context?: Record<string, any>): AuthError => {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    const authError = new AuthError(message, context);
    Logger.error(`Auth Error: ${message}`, error, context);
    return authError;
  },

  network: (error: unknown, context?: Record<string, any>): NetworkError => {
    const message = error instanceof Error ? error.message : 'Network request failed';
    const networkError = new NetworkError(message, context);
    Logger.error(`Network Error: ${message}`, error, context);
    return networkError;
  },

  validation: (message: string, context?: Record<string, any>): ValidationError => {
    const validationError = new ValidationError(message, context);
    Logger.error(`Validation Error: ${message}`, validationError, context);
    return validationError;
  }
};

export default ErrorHandler; 