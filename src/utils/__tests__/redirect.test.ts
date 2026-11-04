import { describe, it, expect } from 'vitest';
import { getSafeRedirectUrl } from '../redirect';

describe('getSafeRedirectUrl helper', () => {
  it('returns valid relative internal paths as-is', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/settings')).toBe('/settings');
    expect(getSafeRedirectUrl('/flashcards?tab=n3')).toBe('/flashcards?tab=n3');
    expect(getSafeRedirectUrl('/subjects/123#overview')).toBe('/subjects/123#overview');
  });

  it('trims leading and trailing whitespace around valid paths', () => {
    expect(getSafeRedirectUrl('   /dashboard   ')).toBe('/dashboard');
  });

  it('returns fallback for null, undefined, and empty string', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl(null, '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('', '/settings')).toBe('/settings');
  });

  it('neutralizes protocol-relative open-redirect attempts (//evil.com)', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('//google.com/path')).toBe('/');
    expect(getSafeRedirectUrl('//evil.com', '/fallback')).toBe('/fallback');
  });

  it('neutralizes absolute URL open-redirect attempts (http/https/javascript)', () => {
    expect(getSafeRedirectUrl('https://attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('http://attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,<html>')).toBe('/');
  });

  it('neutralizes backslash-based evasion attempts (/\\evil.com or \\\\evil.com)', () => {
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/dashboard\\attacker.com')).toBe('/');
  });
});
