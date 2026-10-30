import { useCallback, useEffect, useState } from 'react';
import {
  LessonKanjiService,
  type DueKanjiItem,
  type KanjiMasteryComparison,
} from '../../services/LessonKanjiService';
import type { JlptLevelFilter } from '../../services/KanjiPracticeService';

interface Props {
  userId: string;
  level: JlptLevelFilter;
  onPractice: (item: DueKanjiItem) => void;
}

export function KanjiProgressPanel({ userId, level, onPractice }: Props) {
  const [comparison, setComparison] = useState<KanjiMasteryComparison | null>(null);
  const [due, setDue] = useState<DueKanjiItem[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      setDue(
        LessonKanjiService.getDueKanjis(userId).filter(
          (item) => level === 'ALL' || item.level === level,
        ),
      );
      if (level === 'ALL') {
        setComparison(null);
        return;
      }
      void LessonKanjiService.getMasteryComparison(userId, level).then((result) => {
        if (!cancelled) setComparison(result);
      });
    };
    setComparison(null);
    setMessage('');
    setConfirmReset(false);
    refresh();
    window.addEventListener('kanji-progress-updated', refresh);
    window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      cancelled = true;
      window.removeEventListener('kanji-progress-updated', refresh);
      window.removeEventListener('storage', refresh);
      window.clearInterval(timer);
    };
  }, [userId, level]);

  const sync = useCallback(async () => {
    setSyncError('');
    try {
      await LessonKanjiService.syncAllProgressFromDatabase(userId);
    } catch {
      setSyncError('Server progressi yuklanmadi. Hozir shu qurilmadagi natijalar ko‘rsatilmoqda.');
    }
  }, [userId]);

  useEffect(() => {
    void sync();
  }, [sync]);

  const exportProgress = () => {
    const url = URL.createObjectURL(
      new Blob([LessonKanjiService.exportProgress(userId)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kanji-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage('Shu qurilmadagi barcha Kanji mashq natijalari eksport qilindi.');
  };

  const reset = async () => {
    setBusy(true);
    setMessage('');
    try {
      const result = await LessonKanjiService.resetProgressAndSync(userId);
      setMessage(`${result.resetCount} ta Kanji mashq yozuvi reset qilindi.`);
      setConfirmReset(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reset bajarilmadi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Kanji progressi"
      className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Kanji progressi {level !== 'ALL' && `— ${level}`}</h3>
          <p className="text-xs text-muted-foreground">
            SRS: 1 → 3 → 7 → 14 kun. Xatodan so‘ng 1 kun.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-bold">
          <button type="button" onClick={exportProgress} disabled={busy} className="text-primary">
            JSON eksport
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={busy}
            className="text-destructive"
          >
            Progressni reset qilish
          </button>
        </div>
      </div>
      {syncError && (
        <p role="alert" className="text-xs text-amber-600">
          {syncError}{' '}
          <button type="button" onClick={() => void sync()} className="underline">
            Qayta yuklash
          </button>
        </p>
      )}
      {comparison ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Lesson kanji', data: comparison.lessonKanji },
            { title: 'Umumiy JLPT kanji', data: comparison.jlptKanji },
          ].map(({ title, data }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-3">
              <h4 className="text-xs font-bold">{title}</h4>
              <p className="text-xl font-black">
                {data.mastered}/{data.total}{' '}
                <span className="text-xs font-normal">({data.percentage}%)</span>
              </p>
              <p className="text-xs text-muted-foreground">{data.reviewed} ta ko‘rilgan</p>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card p-3">
            <h4 className="text-xs font-bold">Yozish natijasi</h4>
            <p className="text-xl font-black">{comparison.writingMasteredCount} ta</p>
            <p className="text-xs text-muted-foreground">
              O‘rtacha aniqlik ≥70% va oxirgi stroke-order to‘g‘ri
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Lesson va JLPT ko‘rsatkichlarini ko‘rish uchun darajani tanlang.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Lesson — darsdagi takrorlashlar. Umumiy JLPT — dars va erkin yozish mashqlaridagi natijalar.
        Qo‘lda belgilangan “Mastery” statuslari bu hisobga kirmaydi.
      </p>
      <div>
        <h4 className="mb-2 text-sm font-bold">Bugun qayta ko‘rish kerak ({due.length})</h4>
        {due.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Bugun takrorlash kerak bo‘lgan kanji yo‘q.
          </p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {due.map((item) => (
              <div
                key={`${item.lessonId}-${item.kanji}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div>
                  <span className="mr-2 text-2xl">{item.kanji}</span>
                  <span className="text-xs">{item.meaningUz}</span>
                  <p className="text-[11px] text-muted-foreground">
                    {item.lessonId.startsWith('jlpt-') ? 'Erkin mashq' : item.lessonId} ·{' '}
                    {item.isOverdue ? `${item.daysOverdue} kun kechikkan` : 'Bugun'} ·{' '}
                    {item.intervalDays} kunlik interval
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onPractice(item)}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                >
                  Yozib takrorlash: {item.kanji}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {confirmReset && (
        <div
          role="alertdialog"
          aria-label="Kanji progressini reset qilish"
          className="space-y-2 rounded-xl border border-destructive/30 p-3 text-sm"
        >
          <p>
            Barcha darajalardagi lesson va erkin Kanji mashq natijalari reset qilinadi. Darsning
            yakunlangan holati, XP va qo‘lda belgilangan JLPT statuslari o‘zgarmaydi. Avval JSON
            eksport qilish tavsiya etiladi.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void reset()}
              className="font-bold text-destructive"
            >
              {busy ? 'Bajarilmoqda…' : 'Ha, barcha Kanji mashqlarini reset qilish'}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmReset(false)}>
              Bekor qilish
            </button>
          </div>
        </div>
      )}
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
    </section>
  );
}
