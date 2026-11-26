import { useState } from 'react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';

export function StudyGoal() {
  const { user, targetLevel, setPrimaryFocus } = useStudyData();
  const { language } = useLanguage();
  const lang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';
  const storageKey = `kaiwa_exam_date:${user?.id || 'guest'}`;
  const [date, setDate] = useState(() => safeLocalStorage.getItem(storageKey) || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const days = date
    ? Math.ceil(
        (new Date(`${date}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
      )
    : null;
  return (
    <section className="pb-6 pt-2" aria-labelledby="goal-heading">
      <h2 id="goal-heading" className="text-lg font-semibold">
        {lang === 'uz' ? 'JLPT maqsadingiz' : lang === 'ja' ? 'JLPTの目標' : 'Your JLPT goal'}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 space-y-2 text-sm font-medium">
          <span>
            {lang === 'uz' ? 'Maqsad daraja' : lang === 'ja' ? '目標レベル' : 'Target level'}
          </span>
          <select
            name="targetLevel"
            value={['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel) ? targetLevel : 'N5'}
            disabled={saving}
            onChange={async (e) => {
              setSaving(true);
              setError('');
              try {
                await setPrimaryFocus('ja', e.target.value);
              } catch {
                setError(
                  lang === 'uz'
                    ? 'Daraja saqlanmadi. Qayta urinib ko‘ring.'
                    : lang === 'ja'
                      ? '保存できませんでした。再試行してください。'
                      : 'Could not save your level. Please try again.',
                );
              } finally {
                setSaving(false);
              }
            }}
            className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-input bg-background px-3 text-base text-foreground sm:text-sm"
          >
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-2 text-sm font-medium">
          <span>
            {lang === 'uz'
              ? 'Imtihon sanasi (ixtiyoriy)'
              : lang === 'ja'
                ? '試験日（任意）'
                : 'Exam date (optional)'}
          </span>
          <input
            type="date"
            name="examDate"
            value={date}
            onChange={(e) => {
              const next = e.target.value;
              setDate(next);
              const saved = safeLocalStorage.setItem(storageKey, next);
              setError(
                saved
                  ? ''
                  : lang === 'uz'
                    ? 'Sana saqlanmadi. Brauzer xotirasini tekshiring.'
                    : lang === 'ja'
                      ? '日付を保存できませんでした。'
                      : 'Could not save the date. Check browser storage.',
              );
            }}
            className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-input bg-background px-3 text-base text-foreground sm:text-sm"
          />
        </label>
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {days !== null && Number.isFinite(days)
          ? days >= 0
            ? lang === 'uz'
              ? `Imtihongacha ${days} kun. `
              : lang === 'ja'
                ? `試験まで${days}日。`
                : `${days} days until your exam. `
            : lang === 'uz'
              ? 'Imtihon sanasini yangilang. '
              : lang === 'ja'
                ? '試験日を更新してください。'
                : 'Update your exam date. '
          : ''}
        {lang === 'uz'
          ? 'Sana shu brauzerda saqlanadi.'
          : lang === 'ja'
            ? '日付はこのブラウザに保存されます。'
            : 'The date is saved in this browser.'}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
