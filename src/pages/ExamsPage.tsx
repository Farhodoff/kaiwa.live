import { JlptMockExamPage } from './JlptMockExamPage';
import { useLanguage } from '../context/LanguageContext';

export default function ExamsPage() {
  const { language } = useLanguage();
  return (
    <div className="study-page">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {language === 'uz' ? 'Imtihonlar' : language === 'ja' ? '模擬試験' : 'Practice exams'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === 'uz'
            ? 'Darajangizga mos sinovni tanlang.'
            : language === 'ja'
              ? 'レベルに合うテストを選びましょう。'
              : 'Choose a test at your level.'}
        </p>
      </header>
      <JlptMockExamPage embedded />
    </div>
  );
}
