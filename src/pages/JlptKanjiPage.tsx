import { Suspense, useState } from 'react';
import { JlptTopicPage } from './JlptTopicPage';
import { useLanguage } from '../context/LanguageContext';
import { lazyWithRetry } from '../utils/lazyRetry';
const KanjiCanvasPractice = lazyWithRetry(() => import('../components/jlpt/KanjiCanvasPractice'));
export default function JlptKanjiPage() {
  const { language } = useLanguage();
  const [showPractice, setShowPractice] = useState(false);
  return (
    <JlptTopicPage section="kanji">
      <details
        onToggle={(event) => setShowPractice(event.currentTarget.open)}
        className="rounded-2xl border border-border bg-card p-4"
      >
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
          {language === 'uz'
            ? 'Yozish mashqi'
            : language === 'ja'
              ? '手書き練習'
              : 'Writing practice'}
        </summary>
        {showPractice && (
          <Suspense
            fallback={
              <p role="status">
                {language === 'uz'
                  ? 'Yuklanmoqda…'
                  : language === 'ja'
                    ? '読み込み中…'
                    : 'Loading…'}
              </p>
            }
          >
            <KanjiCanvasPractice />
          </Suspense>
        )}
      </details>
    </JlptTopicPage>
  );
}
