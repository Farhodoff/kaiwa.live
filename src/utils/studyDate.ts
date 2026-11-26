import { format } from 'date-fns';
import { uz } from 'date-fns/locale/uz';

/** Uzbek date names are bundled because some browsers ship incomplete Uzbek ICU data. */
export function formatStudyDate(date: Date, language: string, includeWeekday = false): string {
  if (Number.isNaN(date.getTime())) return '—';
  if (language === 'uz')
    return format(date, includeWeekday ? 'EEEE, d-MMMM' : 'd-MMMM yyyy', { locale: uz });
  return new Intl.DateTimeFormat(
    language === 'ja' ? 'ja-JP' : 'en-GB',
    includeWeekday ? { weekday: 'long', day: 'numeric', month: 'long' } : { dateStyle: 'medium' },
  ).format(date);
}
