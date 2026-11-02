import { setCorsHeaders } from '../_cors.js';

export const config = {
  runtime: 'edge',
};

/**
 * SM-2 Algorithm calculation
 * Quality: 0 (Blackout) to 5 (Perfect recall)
 */
function addCalendarDays(dateInput = new Date(), daysToAdd = 1) {
  let year, month, day;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.substring(0, 10).split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    year = d.getFullYear();
    month = d.getMonth();
    day = d.getDate();
  }

  const target = new Date(Date.UTC(year, month, day + Math.max(0, daysToAdd), 0, 0, 0, 0));
  const targetYear = target.getUTCFullYear();
  const targetMonth = String(target.getUTCMonth() + 1).padStart(2, '0');
  const targetDay = String(target.getUTCDate()).padStart(2, '0');
  const dueDateStr = `${targetYear}-${targetMonth}-${targetDay}`;

  return {
    dueDate: dueDateStr,
    nextReviewDate: `${dueDateStr}T00:00:00.000Z`,
  };
}

/**
 * SM-2 Algorithm calculation
 * Quality: 0 (Blackout) to 5 (Perfect recall)
 */
function calculateSM2(quality, repetitions = 0, interval = 0, easeFactor = 2.5, baseDate = new Date()) {
  const q = Math.max(0, Math.min(5, Number(quality) || 0));
  let newRepetitions = Number(repetitions) || 0;
  let newInterval = Number(interval) || 0;
  let newEaseFactor = Number(easeFactor) || 2.5;

  if (q < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    if (newRepetitions === 0) {
      newInterval = q >= 5 ? 4 : q === 4 ? 2 : 1;
    } else if (newRepetitions === 1) {
      newInterval = q >= 5 ? 10 : q === 4 ? 6 : 3;
    } else {
      const multiplier = q >= 5 ? newEaseFactor * 1.3 : q === 3 ? 1.2 : newEaseFactor;
      newInterval = Math.max(newInterval + 1, Math.round(newInterval * multiplier));
    }
    newRepetitions += 1;
  }

  // Update Ease Factor (min 1.3)
  newEaseFactor = newEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const { dueDate, nextReviewDate } = addCalendarDays(baseDate, newInterval);

  return {
    repetitions: newRepetitions,
    interval: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    dueDate,
    nextReviewDate,
    dueInDays: newInterval,
  };
}

export default async function handler(req) {
  const corsHeaders = {
    'Content-Type': 'application/json',
  };
  setCorsHeaders(req, corsHeaders);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  let quality, repetitions, interval, easeFactor;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    quality = url.searchParams.get('quality');
    repetitions = url.searchParams.get('repetitions');
    interval = url.searchParams.get('interval');
    easeFactor = url.searchParams.get('easeFactor');
  } else if (req.method === 'POST') {
    try {
      const body = await req.json();
      quality = body.quality;
      repetitions = body.repetitions;
      interval = body.interval;
      easeFactor = body.easeFactor;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (quality === undefined || quality === null) {
    return new Response(JSON.stringify({ error: 'Please provide a "quality" (0 to 5).' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const result = calculateSM2(quality, repetitions, interval, easeFactor);

  return new Response(JSON.stringify({ success: true, data: result }), {
    status: 200,
    headers: corsHeaders,
  });
}
