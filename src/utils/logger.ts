import { sanitizeErrorMessage } from '../components/ErrorBoundary';

/**
 * Universal Production-Grade Logger for kaiwa.live
 * Automatically redacts API keys, bearer tokens, passwords, and sensitive strings.
 * Suppresses debug and verbose logs in production environments.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

function formatLogMessage(context: string, message: unknown): string {
  const rawStr =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : JSON.stringify(message);
  return `[${context}] ${sanitizeErrorMessage(rawStr)}`;
}

export const logger = {
  debug(context: string, message: unknown, ...args: unknown[]) {
    if (!isProduction) {
      console.debug(formatLogMessage(context, message), ...args);
    }
  },

  info(context: string, message: unknown, ...args: unknown[]) {
    if (!isProduction) {
      console.info(formatLogMessage(context, message), ...args);
    }
  },

  warn(context: string, message: unknown, ...args: unknown[]) {
    console.warn(formatLogMessage(context, message), ...args);
  },

  error(context: string, message: unknown, error?: unknown) {
    const formatted = formatLogMessage(context, message);
    if (error instanceof Error) {
      console.error(formatted, sanitizeErrorMessage(error.message), error.stack?.slice(0, 300));
    } else if (error) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  },
};

export default logger;
