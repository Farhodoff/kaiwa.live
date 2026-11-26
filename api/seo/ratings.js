import { setCorsHeaders } from '../_cors.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY =
  process.env.SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  const unavailable = () =>
    res.status(200).json({ success: true, source: 'unavailable', aggregateRating: null });
  if (!SUPABASE_URL || !API_KEY) return unavailable();

  try {
    const supabase = createClient(SUPABASE_URL, API_KEY);
    let count = 0;
    let sum = 0;
    // Page through the ratings so the count is not silently capped by the Data API.
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('app_reviews')
        .select('rating')
        .order('id')
        .range(offset, offset + pageSize - 1);
      if (error || !Array.isArray(data)) return unavailable();
      for (const review of data) {
        const rating = Number(review.rating);
        if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
          count++;
          sum += rating;
        }
      }
      if (data.length < pageSize) break;
    }
    return res.status(200).json({
      success: true,
      source: count ? 'live' : 'empty',
      aggregateRating: count
        ? {
            '@type': 'AggregateRating',
            ratingValue: (sum / count).toFixed(1),
            ratingCount: count,
            bestRating: '5',
            worstRating: '1',
          }
        : null,
    });
  } catch {
    return unavailable();
  }
}
