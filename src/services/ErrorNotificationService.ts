import React from 'react';
import { toast } from '../hooks/use-toast';
import { ToastAction } from '../components/ui/toast';
import { sanitizeErrorMessage } from '../components/ErrorBoundary';
import { recordTelemetryEvent } from '../lib/errorTracking';

export interface NotifyErrorOptions {
  title?: string;
  message?: string;
  error?: unknown;
  retryAction?: () => void | Promise<void>;
  retryLabel?: string;
  duration?: number;
  context?: Record<string, any>;
  silentTelemetry?: boolean;
}

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  backoff?: number;
  contextName?: string;
  onRetry?: (attempt: number, error: unknown) => void;
  showErrorToast?: boolean;
  toastTitle?: string;
}

export interface SafeAsyncOptions extends RetryOptions {
  errorTitle?: string;
  errorMessage?: string;
  silent?: boolean;
}

// In-memory set for deduplicating repeated toast messages within a debounce window
const recentNotifications = new Map<string, number>();
const NOTIFICATION_DEBOUNCE_MS = 2500;

export class ErrorNotificationService {
  /**
   * Displays a structured, actionable error toast to the user with an optional retry callback.
   * Automatically sanitizes messages, deduplicates rapid occurrences, and logs to telemetry.
   */
  static notifyError(options: NotifyErrorOptions): void {
    const rawError = options.error;
    let rawMsg = options.message;

    if (!rawMsg) {
      if (rawError instanceof Error) {
        rawMsg = rawError.message;
      } else if (typeof rawError === 'string') {
        rawMsg = rawError;
      } else if (rawError && typeof rawError === 'object' && 'message' in rawError) {
        rawMsg = String((rawError as any).message);
      } else {
        rawMsg = 'Kutilmagan xatolik yuz berdi';
      }
    }

    const safeMessage = sanitizeErrorMessage(rawMsg || 'Kutilmagan xatolik yuz berdi');
    const safeTitle = options.title || 'Xatolik yuz berdi';
    const dedupKey = `${safeTitle}:::${safeMessage}`;

    const now = Date.now();
    const lastShown = recentNotifications.get(dedupKey);
    if (lastShown && now - lastShown < NOTIFICATION_DEBOUNCE_MS) {
      return;
    }
    recentNotifications.set(dedupKey, now);

    // Record in sanitized telemetry buffer
    if (!options.silentTelemetry) {
      recordTelemetryEvent('api', `[Notification] ${safeTitle}: ${safeMessage}`, {
        success: false,
        metadata: options.context,
      });
    }

    // Build action element if retry callback provided
    let actionElement: React.ReactElement | undefined;
    if (options.retryAction) {
      const retryFn = options.retryAction;
      const retryLabel = options.retryLabel || 'Qayta urinish';

      actionElement = React.createElement(
        ToastAction,
        {
          altText: retryLabel,
          onClick: () => {
            try {
              const res = retryFn();
              if (res instanceof Promise) {
                res.catch((retryErr) => {
                  console.error('[ErrorNotificationService] Retry action failed:', retryErr);
                  ErrorNotificationService.notifyError({
                    title: 'Qayta urinishda xatolik',
                    error: retryErr,
                  });
                });
              }
            } catch (err) {
              console.error('[ErrorNotificationService] Retry invocation failed:', err);
            }
          },
        },
        retryLabel,
      );
    }

    toast({
      variant: 'destructive',
      title: safeTitle,
      description: safeMessage,
      action: actionElement,
    });
  }

  /**
   * Executes an asynchronous task with exponential backoff and retry mechanism.
   * If all attempts fail, optionally displays an actionable notification with manual retry.
   */
  static async withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const retries = options.retries ?? 2;
    const baseDelay = options.delayMs ?? 500;
    const backoff = options.backoff ?? 2;
    const contextName = options.contextName || 'async_task';

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (options.onRetry) {
          options.onRetry(attempt + 1, err);
        }

        if (attempt < retries) {
          const delayTime = baseDelay * Math.pow(backoff, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        }
      }
    }

    // If configured, notify user with retry button
    if (options.showErrorToast) {
      this.notifyError({
        title: options.toastTitle || `${contextName} bajarilmadi`,
        error: lastError,
        retryAction: () => {
          this.withRetry(fn, options);
        },
      });
    }

    throw lastError;
  }

  /**
   * Safely wraps an asynchronous operation, preventing uncaught rejections.
   * On failure, logs telemetry, notifies user (if not silent), and returns fallback value.
   */
  static async safeAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    options: SafeAsyncOptions = {},
  ): Promise<T> {
    try {
      if (options.retries && options.retries > 0) {
        return await this.withRetry(fn, options);
      }
      return await fn();
    } catch (err) {
      if (!options.silent) {
        this.notifyError({
          title: options.errorTitle || "Amalni bajarib bo'lmadi",
          message: options.errorMessage,
          error: err,
          retryAction: () => {
            void this.safeAsync(fn, fallback, options);
          },
        });
      } else {
        recordTelemetryEvent('api', `[SafeAsync Silenced] ${options.contextName || 'task'}`, {
          success: false,
          metadata: {
            error: sanitizeErrorMessage(err instanceof Error ? err.message : String(err)),
          },
        });
      }
      return fallback;
    }
  }

  /**
   * Clears in-memory debounce cache (useful in unit tests).
   */
  static clearDebounceCache(): void {
    recentNotifications.clear();
  }
}
