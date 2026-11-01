/**
 * PWA Workbox Runtime Caching Configuration
 *
 * Provides robust offline caching strategies for:
 * 1. Large lazy-loaded curriculum and vocabulary chunks
 * 2. Navigation HTML (offline fallback)
 * 3. Version checking (NetworkOnly)
 * 4. Google & Gstatic web fonts
 * 5. KanjiVG stroke order vector SVGs (Joyo + Jinmeiyo kanji)
 * 6. External ambient and focus audio streams (Pixabay, Google Actions, Mixkit)
 * 7. Dicebear avatar SVGs for offline profile icons
 * 8. Same-origin local audio files
 * 9. Supabase storage public audio files
 */

export interface WorkboxExpiration {
  maxEntries?: number;
  maxAgeSeconds?: number;
}

export interface WorkboxCacheableResponse {
  statuses: number[];
}

export interface WorkboxCachingOptions {
  cacheName: string;
  networkTimeoutSeconds?: number;
  expiration?: WorkboxExpiration;
  cacheableResponse?: WorkboxCacheableResponse;
}

export interface WorkboxRuntimeCachingRule {
  urlPattern: RegExp | ((options: { request: Request; url: URL }) => boolean);
  handler: 'CacheFirst' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate';
  options?: WorkboxCachingOptions;
}

export const pwaGlobIgnores = [
  '**/images/**',
  '**/og-image.png',
  '**/kanji-strokes-*.js',
  '**/jlpt-vocab-*.js',
  '**/jlpt-deck-*.js',
  '**/curriculum-*.js',
  '**/jlpt_n1-*.js',
  '**/jlpt_n2-*.js',
  '**/jlpt_n3-*.js',
  '**/jlpt_n4-*.js',
  '**/jlpt_n5-*.js',
  '**/AdminDashboardPage-*.js',
  '**/Admin*.js',
  '**/*Modal-*.js',
  '**/*Page-*.js',
  '**/dnd-kit-*.js',
  '**/analytics-*.js',
  '**/framer-motion-*.js',
  '**/JlptGrammarKanjiMaster-*.js',
  '**/jlpt-grammar-kanji-data-*.js',
  '**/minna_shokyu*.js',
  '**/pdf.worker-*.js',
  '**/pdf.worker-*.mjs',
  '**/pdf-*.js',
  '**/*_500_mon-*.js',
  '**/*_thematic_*.js',
  '**/*_collocations-*.js',
  '**/*_yojijukugo-*.js',
  '**/listening_data-*.js',
  '**/Exam*.js',
  '**/CustomContent*.js',
  '**/JlptMockExamPage-*.js',
  '**/JlptListeningMockPage-*.js',
  '**/kanji_master_*.js',
  '**/n1AdvancedContent-*.js',
  '**/japaneseDiagnosticBank-*.js',
];

export const pwaRuntimeCaching: WorkboxRuntimeCachingRule[] = [
  {
    urlPattern:
      /assets\/(?:kanji-strokes|jlpt-vocab|jlpt-deck|curriculum-|jlpt_n[1-5]|jlpt-grammar-kanji-data|Admin|.*Modal|.*Page|dnd-kit|analytics|framer-motion|JlptGrammarKanjiMaster|minna_shokyu|pdf|.*_500_mon|.*_thematic_.*|.*_collocations|.*_yojijukugo|listening_data|Exam|CustomContent|JlptMockExam|JlptListeningMock|kanji_master|n1AdvancedContent|japaneseDiagnosticBank).*\.(?:js|mjs)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'large-data-chunks-cache',
      expiration: {
        maxEntries: 120,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|webp|gif|ico)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images-cache',
      expiration: {
        maxEntries: 80,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'html-cache',
      networkTimeoutSeconds: 2,
      expiration: {
        maxEntries: 1,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /version\.json/i,
    handler: 'NetworkOnly',
  },
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'gstatic-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/KanjiVG\/kanjivg\/kanji\/.*\.svg$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'kanjivg-svg-cache',
      expiration: {
        maxEntries: 2500, // Covers ~2,136 Joyo + Jinmeiyo kanji
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year (kanjivg SVGs are immutable)
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern:
      /^https:\/\/(?:cdn\.pixabay\.com|actions\.google\.com|assets\.mixkit\.co)\/.*\.(?:mp3|wav|ogg|m4a)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'external-audio-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'dicebear-avatar-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:mp3|wav|ogg|m4a)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'audio-assets-cache',
      expiration: {
        maxEntries: 350,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\/api\/tts(?:\?.*)?$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'tts-api-cache',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*audio.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'supabase-audio-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];
