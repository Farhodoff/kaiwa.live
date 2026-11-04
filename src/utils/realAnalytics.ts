import { Flashcard, Task, StudySession } from '../types';

export interface RealPerformanceMetrics {
  totalVocabLearned: number;
  vocabRetentionRate: number; // percentage 0-100
  todayCompletedTasks: number;
  todayTotalTasks: number;
  todayFocusMinutes: number;
  weakestArea: string;
  diagnosticMessage: string;
  actionableTip: string;
}

export const calculateRealMetrics = (
  flashcards: Flashcard[],
  tasks: Task[],
  sessions: StudySession[],
): RealPerformanceMetrics => {
  // 1. Calculate Real Vocab Stats
  const totalVocabLearned = flashcards.length;
  const reviewedCards = flashcards.filter((f) => f.repetitions > 0);
  const wellLearnedCards = flashcards.filter((f) => f.repetitions >= 2 && f.easeFactor >= 2.3);
  const vocabRetentionRate =
    reviewedCards.length > 0
      ? Math.round((wellLearnedCards.length / reviewedCards.length) * 100)
      : totalVocabLearned > 0
        ? 85
        : 0;

  // 2. Today's Tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(todayStr));
  const todayCompletedTasks = todayTasks.filter((t) => t.completed).length;

  // 3. Today's Focus Minutes
  const todaySessions = sessions.filter(
    (s) => s.completed && s.startTime && s.startTime.startsWith(todayStr),
  );
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  // 4. Identify Real Weakest Area ("Qayerda oqsayotgani")
  let weakestArea = 'Grammatika va Collocations';
  let diagnosticMessage =
    "Lug'at takrorlash davomiyligi yaxshi, ammo murakkab gap qurilmalarida e'tibor talab etiladi.";
  let actionableTip = 'Kuniga 15 daqiqa Anki SM-2 takrorlash rejimida B2-C1 iboralarni yodlang.';

  if (vocabRetentionRate < 70 && totalVocabLearned > 0) {
    weakestArea = "Lug'atni Esda Saqlash (Memory Retention)";
    diagnosticMessage = `Siz kiritgan so'zlarning ${100 - vocabRetentionRate}% qismi tez unutilmoqda. Qayta takrorlash oralig'i mos emas.`;
    actionableTip =
      "Kartochkalarni har kuni 'Qayta' va 'Qiyin' tugmalari bilan intervalni qisqartirib takrorlang.";
  } else if (todayTasks.length > 0 && todayCompletedTasks / todayTasks.length < 0.5) {
    weakestArea = 'Kunlik Reja Bajarilishi (Task Execution)';
    diagnosticMessage = `Bugungi rejalashtirilgan topshiriqlarning atigi ${Math.round((todayCompletedTasks / todayTasks.length) * 100)}% qismi bajarildi.`;
    actionableTip = "Katta topshiriqlarni 25 daqiqalik Pomodoro bloklariga bo'lib chiqing.";
  } else if (todayFocusMinutes < 30) {
    weakestArea = 'Diqqat va Konsentratsiya (Focus Time)';
    diagnosticMessage = 'Bugun dars qilishga kam vaqt ajratildi (30 daqiqadan kam).';
    actionableTip = 'Kamida 2 ta Pomodoro seansini bajarib kunlik marraga erishing.';
  }

  return {
    totalVocabLearned,
    vocabRetentionRate,
    todayCompletedTasks,
    todayTotalTasks: todayTasks.length,
    todayFocusMinutes,
    weakestArea,
    diagnosticMessage,
    actionableTip,
  };
};
