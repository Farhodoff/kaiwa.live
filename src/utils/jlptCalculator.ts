export interface JlptHoursAnalysis {
  totalRequiredHours: number;
  dailyRequiredHours: number;
  feasibilityStatus: 'realistic' | 'intensive' | 'unrealistic';
  statusText: string;
  recommendedDays: number;
  description: string;
}

// Official JLPT Guided Learning Hours Standard
export const JLPT_HOURS_MAP: Record<string, number> = {
  '0': 0, // Complete Beginner (Noldan)
  N5: 150, // Beginner (A1)
  N4: 300, // Upper Beginner (A2)
  N3: 450, // Intermediate (B1)
  N2: 650, // Upper Intermediate (B2)
  N1: 900, // Advanced (C1/C2)
};

export const calculateJlptFeasibility = (
  currentLevel: string,
  targetLevel: string,
  durationDays: number,
): JlptHoursAnalysis => {
  const currentHours = JLPT_HOURS_MAP[currentLevel] ?? 0;
  const targetHours = JLPT_HOURS_MAP[targetLevel] ?? 450;

  const totalRequiredHours = Math.max(50, targetHours - currentHours);
  const dailyRequiredHours = parseFloat(
    (totalRequiredHours / Math.max(1, durationDays)).toFixed(1),
  );

  const recommendedDays = Math.ceil(totalRequiredHours / 2.5);

  let feasibilityStatus: 'realistic' | 'intensive' | 'unrealistic' = 'realistic';
  let statusText = '🟢 Real va Bajarish Mumkin';
  let description = "Ushbu JLPT rejasida kunlik o'quv yuki sog'lom darajada.";

  if (dailyRequiredHours > 6.0) {
    feasibilityStatus = 'unrealistic';
    statusText = '🔴 Noreal / Haddan Tashqari Bosim';
    description = `Kuniga ${dailyRequiredHours} soat Yapon tili va Kanji yodlash miyaga og'ir. Tavsiya etilgan muddat: ${recommendedDays} kun (kuniga 2.5 soatdan).`;
  } else if (dailyRequiredHours > 3.5) {
    feasibilityStatus = 'intensive';
    statusText = '🟡 Intensiv (Jiddiy Intizom Talab Qilinadi)';
    description = `Kuniga ${dailyRequiredHours} soat shug'ullanish va Kanji yodlash talab etiladi.`;
  }

  return {
    totalRequiredHours,
    dailyRequiredHours,
    feasibilityStatus,
    statusText,
    recommendedDays,
    description,
  };
};
