import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSEO, applyAggregateRatingToDOM, syncLiveAggregateRating } from '../useSEO';

describe('useSEO & Dynamic Google Rich Results Schema', () => {
  beforeEach(() => {
    document.title = '';
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('updates document.title and canonical link correctly', () => {
    renderHook(() =>
      useSEO({
        title: 'JLPT N2 Grammatika',
        description: 'Test tavsif',
        canonical: '/jlpt',
      }),
    );

    expect(document.title).toBe('JLPT N2 Grammatika — kaiwa.live');
    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonicalLink).toBeTruthy();
    expect(canonicalLink?.href).toBe('https://kaiwa.live/jlpt');
  });

  it('applies aggregateRating to existing WebApplication in JSON-LD script', () => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'kaiwa.live',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '100',
          },
        },
      ],
    });
    document.head.appendChild(script);

    const updated = applyAggregateRatingToDOM({
      ratingValue: '4.95',
      ratingCount: 12500,
      bestRating: '5',
      worstRating: '1',
    });

    expect(updated).toBe(true);
    const parsed = JSON.parse(script.textContent || '{}');
    expect(parsed['@graph'][0].aggregateRating.ratingValue).toBe('4.95');
    expect(parsed['@graph'][0].aggregateRating.ratingCount).toBe('12500');
  });

  it('syncLiveAggregateRating fetches live ratings and updates the DOM', async () => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'kaiwa.live',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        ratingCount: '500',
      },
    });
    document.head.appendChild(script);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        source: 'live',
        aggregateRating: {
          ratingValue: '4.92',
          ratingCount: 12488,
          bestRating: '5',
          worstRating: '1',
          reviewCount: 8,
        },
      }),
    });
    global.fetch = mockFetch;

    const result = await syncLiveAggregateRating(true);
    expect(result).toBeTruthy();
    expect(result?.ratingValue).toBe('4.92');

    const parsed = JSON.parse(script.textContent || '{}');
    expect(parsed.aggregateRating.ratingValue).toBe('4.92');
    expect(parsed.aggregateRating.ratingCount).toBe('12488');
  });
});
