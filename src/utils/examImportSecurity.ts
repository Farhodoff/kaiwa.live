/**
 * Exam import / upload security hardening (Task 15).
 *
 * Centralizes the production guardrails for the admin exam import flow:
 *  - who may import (admin / reviewer only) and who may publish (admin only)
 *  - upload size + format validation per file kind
 *  - published question immutability for non-admin reviewers
 *  - a fail-closed rate limiter for bulk imports
 *  - error sanitization so secrets never reach the UI / logs
 */

import { sanitizeErrorMessage } from '../components/ErrorBoundary';

export const IMPORT_ALLOWED_ROLES = ['admin', 'superadmin', 'reviewer'] as const;
export const IMPORT_PUBLISH_ROLES = ['admin', 'superadmin'] as const;

type RoleInput = string | null | undefined;

function normalizeRole(role: RoleInput): string {
  if (!role) return '';
  const r = String(role).toLowerCase().trim();
  return r === 'authenticated' ? '' : r;
}

function normalizeEmail(email: string | null | undefined): string {
  return email ? String(email).toLowerCase().trim() : '';
}

/**
 * Only admins, superadmins and reviewers may run any exam import.
 */
export function canImportExamContent(email?: string | null, role?: RoleInput): boolean {
  const r = normalizeRole(role);
  if ((IMPORT_ALLOWED_ROLES as readonly string[]).includes(r)) return true;
  const e = normalizeEmail(email);
  if (!e) return false;
  return e === 'fsoyilov@gmail.com' || e === 'admin@kaiwa.live' || e === 'admin@nihongo-talk.jp';
}

/**
 * Publishing (is_published = true) is admin-only; reviewers can only save drafts.
 */
export function canPublishExamContent(email?: string | null, role?: RoleInput): boolean {
  const r = normalizeRole(role);
  if ((IMPORT_PUBLISH_ROLES as readonly string[]).includes(r)) return true;
  const e = normalizeEmail(email);
  if (!e) return false;
  return e === 'fsoyilov@gmail.com' || e === 'admin@kaiwa.live' || e === 'admin@nihongo-talk.jp';
}

/**
 * Reviewers must never mutate already-published questions; only admins can.
 */
export function canMutatePublishedQuestion(
  isPublished: boolean,
  email?: string | null,
  role?: RoleInput,
): boolean {
  if (!isPublished) return canImportExamContent(email, role);
  return canPublishExamContent(email, role);
}

export type ImportUploadKind = 'pdf' | 'json' | 'csv' | 'text' | 'audio';

export interface ImportUploadLimits {
  maxBytes: number;
  extensions: readonly string[];
  mimeTypes: readonly string[];
  label: string;
}

const MB = 1024 * 1024;

export const IMPORT_UPLOAD_LIMITS: Record<ImportUploadKind, ImportUploadLimits> = {
  pdf: {
    maxBytes: 20 * MB,
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    label: 'PDF',
  },
  json: {
    maxBytes: 10 * MB,
    extensions: ['.json'],
    mimeTypes: ['application/json', 'text/plain', ''],
    label: 'JSON',
  },
  csv: {
    maxBytes: 10 * MB,
    extensions: ['.csv'],
    mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain', ''],
    label: 'CSV',
  },
  text: {
    maxBytes: 10 * MB,
    extensions: ['.txt'],
    mimeTypes: ['text/plain', ''],
    label: 'TXT',
  },
  audio: {
    maxBytes: 25 * MB,
    extensions: ['.webm', '.mp3', '.m4a', '.wav', '.ogg', '.opus'],
    mimeTypes: ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'],
    label: 'Audio',
  },
};

export interface ImportUploadLike {
  name?: string;
  size?: number;
  type?: string;
}

export function detectImportUploadKind(file: ImportUploadLike): ImportUploadKind | null {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
  if (name.endsWith('.json') || type === 'application/json') return 'json';
  if (name.endsWith('.csv') || type === 'text/csv') return 'csv';
  if (name.endsWith('.txt') || type === 'text/plain') return 'text';
  if (type.startsWith('audio/')) return 'audio';
  return null;
}

export interface ImportUploadValidation {
  valid: boolean;
  error?: string;
  kind: ImportUploadKind | null;
}

/**
 * Validates an uploaded file against the per-kind size + extension/MIME limits.
 * Fails closed: unknown kinds and empty files are rejected.
 */
export function validateImportUpload(
  file: ImportUploadLike,
  expectedKind?: ImportUploadKind,
): ImportUploadValidation {
  const kind = expectedKind || detectImportUploadKind(file);
  if (!kind) {
    return { valid: false, kind: null, error: "Qo'llab-quvvatlanmaydigan fayl formati." };
  }

  const limits = IMPORT_UPLOAD_LIMITS[kind];
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  const hasKnownExt = limits.extensions.some((ext) => name.endsWith(ext));
  const hasKnownMime = limits.mimeTypes.includes(type);
  // A browser-reported MIME that is neither allowed nor generic signals a
  // spoofed file type — reject it even when the extension looks correct.
  const genericMime = type === '' || type === 'application/octet-stream';
  const mimeOk = genericMime || hasKnownMime;
  if (!hasKnownExt || !mimeOk) {
    return {
      valid: false,
      kind,
      error: `Faqat ${limits.label} formatidagi fayllar qabul qilinadi (${limits.extensions.join(', ')}).`,
    };
  }

  const size = typeof file.size === 'number' ? file.size : 0;
  if (!size || size <= 0) {
    return { valid: false, kind, error: `${limits.label} fayl bo'sh.` };
  }
  if (size > limits.maxBytes) {
    const maxMb = (limits.maxBytes / MB).toFixed(0);
    return {
      valid: false,
      kind,
      error: `${limits.label} fayl hajmi juda katta (${(size / MB).toFixed(1)} MB). Maksimum ${maxMb} MB.`,
    };
  }

  return { valid: true, kind };
}

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface ImportRateLimiter {
  check(key: string, now?: number): RateLimitResult;
  reset(key?: string): void;
}

/**
 * In-memory sliding-window rate limiter for the import flow. The store keyed by
 * user id ensures a single admin cannot hammer the import path; server-side RLS
 * remains the ultimate authority.
 */
export function createImportRateLimiter(options: RateLimitOptions): ImportRateLimiter {
  const max = Math.max(1, Math.floor(options.max));
  const windowMs = Math.max(1, Math.floor(options.windowMs));
  const store = new Map<string, number[]>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const k = key || 'anonymous';
      const cutoff = now - windowMs;
      const hits = (store.get(k) || []).filter((t) => t > cutoff);

      if (hits.length >= max) {
        const oldest = hits[0];
        store.set(k, hits);
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, oldest + windowMs - now),
        };
      }

      hits.push(now);
      store.set(k, hits);
      return { allowed: true, remaining: max - hits.length, retryAfterMs: 0 };
    },
    reset(key?: string) {
      if (key === undefined) store.clear();
      else store.delete(key);
    },
  };
}

const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const SERVICE_ROLE_RE = /\b(service_role|service-role|SERVICE_ROLE|sbp_[A-Za-z0-9_-]{20,})\b/g;

/**
 * Sanitizes an import error before it reaches the UI or audit log. Extends the
 * shared sanitizer with JWT / service-role redaction and trims stack traces.
 */
export function sanitizeImportError(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : '';

  const noStack = raw.split('\n')[0].trim();
  return sanitizeErrorMessage(noStack)
    .replace(JWT_RE, '[REDACTED_JWT]')
    .replace(SERVICE_ROLE_RE, '[REDACTED_SERVICE_ROLE]');
}

/** Shared limiter used by the exam bulk import modal. */
export const examImportRateLimiter = createImportRateLimiter({ max: 5, windowMs: 60_000 });
