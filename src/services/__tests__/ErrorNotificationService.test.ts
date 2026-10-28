import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ErrorNotificationService } from '../ErrorNotificationService';
import { toast } from '../../hooks/use-toast';
import { getTelemetryBuffer, clearTelemetryBuffer } from '../../lib/errorTracking';

vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ErrorNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTelemetryBuffer();
    ErrorNotificationService.clearDebounceCache();
  });

  describe('notifyError', () => {
    it('should trigger toast with destructive variant and sanitized message', () => {
      ErrorNotificationService.notifyError({
        title: 'Yuklashda xatolik',
        message: "Serverga ulanib bo'lmadi: Bearer secret_token_12345",
      });

      expect(toast).toHaveBeenCalledTimes(1);
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Yuklashda xatolik',
          description: expect.stringContaining('Bearer [REDACTED]'),
        }),
      );

      const buffer = getTelemetryBuffer();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer[0].message).toContain('Yuklashda xatolik');
      expect(buffer[0].message).toContain('Bearer [REDACTED]');
    });

    it('should debounce identical error notifications within debounce window', () => {
      ErrorNotificationService.notifyError({
        title: 'Tarmoq xatosi',
        message: 'Ulanish uzildi',
      });
      ErrorNotificationService.notifyError({
        title: 'Tarmoq xatosi',
        message: 'Ulanish uzildi',
      });

      expect(toast).toHaveBeenCalledTimes(1);
    });

    it('should attach a retry action element when retryAction callback is provided', () => {
      const retryMock = vi.fn();
      ErrorNotificationService.notifyError({
        title: 'Saqlash xatosi',
        message: 'Bazaga yozilmadi',
        retryAction: retryMock,
        retryLabel: 'Qayta saqlash',
      });

      expect(toast).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(toast).mock.calls[0][0];
      expect(callArg.action).toBeDefined();
    });
  });

  describe('withRetry', () => {
    it('should succeed immediately if the task succeeds on first attempt', async () => {
      const task = vi.fn().mockResolvedValue('success');
      const result = await ErrorNotificationService.withRetry(task, { retries: 2, delayMs: 10 });

      expect(result).toBe('success');
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed if subsequent attempt passes', async () => {
      const task = vi
        .fn()
        .mockRejectedValueOnce(new Error('Flaky connection'))
        .mockResolvedValueOnce('recovered');

      const onRetryMock = vi.fn();
      const result = await ErrorNotificationService.withRetry(task, {
        retries: 2,
        delayMs: 10,
        onRetry: onRetryMock,
      });

      expect(result).toBe('recovered');
      expect(task).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should throw and optionally show toast when all retry attempts fail', async () => {
      const task = vi.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        ErrorNotificationService.withRetry(task, {
          retries: 2,
          delayMs: 10,
          showErrorToast: true,
          toastTitle: 'Doimiy xatolik',
        }),
      ).rejects.toThrow('Persistent error');

      expect(task).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Doimiy xatolik',
          description: 'Persistent error',
        }),
      );
    });
  });

  describe('safeAsync', () => {
    it('should return result if operation succeeds', async () => {
      const task = vi.fn().mockResolvedValue({ loaded: true });
      const res = await ErrorNotificationService.safeAsync(task, { loaded: false });

      expect(res).toEqual({ loaded: true });
    });

    it('should catch error, return fallback, and notify user', async () => {
      const task = vi.fn().mockRejectedValue(new Error('Disk full'));
      const res = await ErrorNotificationService.safeAsync(task, 'fallback_val', {
        errorTitle: 'Fayl tizimi xatosi',
      });

      expect(res).toBe('fallback_val');
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Fayl tizimi xatosi',
          description: 'Disk full',
        }),
      );
    });

    it('should suppress toast when silent option is set to true', async () => {
      const task = vi.fn().mockRejectedValue(new Error('Background analytics failed'));
      const res = await ErrorNotificationService.safeAsync(task, null, {
        silent: true,
        contextName: 'analytics',
      });

      expect(res).toBeNull();
      expect(toast).not.toHaveBeenCalled();
    });
  });
});
