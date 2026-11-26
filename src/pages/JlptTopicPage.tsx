import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { JlptStudyShell } from '../components/jlpt/JlptStudyShell';
import { lazyWithRetry } from '../utils/lazyRetry';
import { JLPT_TOPIC_PATHS, resolveStudyLevel, StudyTopic } from '../utils/jlptStudyRoutes';
const TopicContent = lazyWithRetry(() => import('../components/jlpt/JlptGrammarKanjiMaster'));
const titles = {
  goi: { uz: 'Lug‘at', ja: '語彙', en: 'Vocabulary' },
  kanji: { uz: 'Kanji', ja: '漢字', en: 'Kanji' },
  grammar: { uz: 'Grammatika', ja: '文法', en: 'Grammar' },
};
export function JlptTopicPage({
  section,
  children,
}: {
  section: StudyTopic;
  children?: ReactNode;
}) {
  const [params] = useSearchParams();
  const { targetLevel } = useStudyData();
  const { language } = useLanguage();
  const title = titles[section][language];
  const level = resolveStudyLevel(params.get('level'), targetLevel);
  useSEO({ title: `JLPT ${level} — ${title}`, canonical: JLPT_TOPIC_PATHS[section] });
  return (
    <JlptStudyShell area={section} title={title}>
      {children}
      <Suspense
        fallback={
          <p role="status">
            {language === 'uz' ? 'Yuklanmoqda…' : language === 'ja' ? '読み込み中…' : 'Loading…'}
          </p>
        }
      >
        <TopicContent key={section} section={section} initialTab={section} initialLevel={level} />
      </Suspense>
    </JlptStudyShell>
  );
}
