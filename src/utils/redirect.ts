/**
 * Validates and sanitizes a redirect target URL to ensure it is a safe internal relative path.
 * Protects against open-redirect vulnerabilities (e.g. //evil.com, https://attacker.com, /\evil.com).
 */
export const getSafeRedirectUrl = (url: string | null | undefined, fallback = '/'): string => {
  if (!url) return fallback;
  const trimmed = url.trim();
  // Must start with '/' and not '//' (protocol-relative), and not contain backslashes
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed;
  }
  return fallback;
};
