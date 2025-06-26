interface LogContext {
  [key: string]: any;
}

export class Logger {
  private static isDev = __DEV__;
  private static isProduction = process.env.NODE_ENV === 'production';

  static debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  static info(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  static warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || '');
  }

  static error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error || '', context || '');
  }

  static auth(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[AUTH] ${message}`, context || '');
    }
  }

  static api(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[API] ${message}`, context || '');
    }
  }

  static trpc(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[TRPC] ${message}`, context || '');
    }
  }

  static db(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[DB] ${message}`, context || '');
    }
  }
}

// Convenience exports for common use cases
export const log = Logger.debug;
export const logError = Logger.error;
export const logAuth = Logger.auth;
export const logApi = Logger.api; 