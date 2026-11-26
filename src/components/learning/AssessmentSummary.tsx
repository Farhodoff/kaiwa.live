import { studyAreaHref, StudyLevel } from '../../utils/jlptStudyRoutes';
import { Link } from 'react-router-dom';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TimedSkillAssessmentService,
  TimedSkill,
} from '../../services/TimedSkillAssessmentService';

const skills: { key: TimedSkill; tab: string; uz: string; en: string; ja: string }[] = [
  { key: 'knowledge', tab: 'grammar', uz: 'Til bilimi', en: 'Language knowledge', ja: '言語知識' },
  { key: 'reading', tab: 'reading', uz: 'O‘qish', en: 'Reading', ja: '読解' },
  { key: 'listening', tab: 'listening', uz: 'Tinglash', en: 'Listening', ja: '聴解' },
];

/** Shows answer accuracy, never an inferred pass probability or an official JLPT score. */
export function AssessmentSummary() {
  const { user, targetLevel } = useStudyData();
  const { language } = useLanguage();
  const lang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';
  const level = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel) ? targetLevel : 'N5';
  const attempts = TimedSkillAssessmentService.getAttempts(user?.id).filter(
    (a) => a.level === level,
  );
  return (
    <section className="space-y-6 py-2" aria-labelledby="assessment-heading">
      <div>
        <h2 id="assessment-heading" className="text-xl font-semibold">
          {lang === 'uz'
            ? 'Mashqlardagi natijalaringiz'
            : lang === 'ja'
              ? '練習の正答率'
              : 'Your practice results'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {lang === 'uz'
            ? 'Javoblaringiz asosidagi ko‘rsatkichlar. Rasmiy JLPT bahosi emas.'
            : lang === 'ja'
              ? '回答済みの問題に基づく正答率です。JLPTの得点や合格確率ではありません。'
              : 'Based on answered questions from completed practice exams. These are practice results, not official JLPT scores or pass predictions.'}
        </p>
      </div>
      <div className="grid divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {skills.map((skill) => {
          const answered = attempts.filter(
            (a) =>
              (skill.key === 'knowledge'
                ? ['knowledge', 'vocabulary', 'grammar'].includes(a.skill)
                : a.skill === skill.key) && !a.skipped,
          );
          const accuracy = answered.length
            ? Math.round((answered.filter((a) => a.correct).length / answered.length) * 100)
            : null;
          return (
            <Link
              key={skill.key}
              to={studyAreaHref(skill.tab, level as StudyLevel)}
              className="group block py-5 transition-colors first:pl-0 last:pr-0 hover:text-primary sm:px-6"
            >
              <h3 className="text-sm font-medium">{skill[lang]}</h3>
              <p className="my-3 text-4xl font-semibold tabular-nums tracking-tight">
                {accuracy === null ? '—' : `${accuracy}%`}
              </p>
              <p className="text-sm text-muted-foreground">
                {answered.length
                  ? `${answered.length} ${lang === 'uz' ? 'ta javob' : lang === 'ja' ? '回答' : 'answers'}`
                  : lang === 'uz'
                    ? 'Hali baholanmagan. Mashqni boshlang.'
                    : lang === 'ja'
                      ? '未測定。練習を始めましょう。'
                      : 'Not assessed yet. Start practicing.'}
              </p>
            </Link>
          );
        })}
      </div>
      {!attempts.some((attempt) => !attempt.skipped) && (
        <Link
          to={`/exams?level=${level}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
        >
          {lang === 'uz'
            ? 'Darajangizni sinovda tekshiring'
            : lang === 'ja'
              ? '模擬試験で現在の実力を確認 →'
              : 'Take a practice exam to establish your starting point →'}
        </Link>
      )}
    </section>
  );
}
