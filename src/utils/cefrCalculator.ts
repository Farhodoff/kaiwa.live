export interface CefrHoursAnalysis {
  totalRequiredHours: number;
  dailyRequiredHours: number;
  feasibilityStatus: 'realistic' | 'intensive' | 'unrealistic';
  statusText: string;
  recommendedDays: number;
  description: string;
}

// Cambridge Assessment Standard Guided Learning Hours
export const BAND_HOURS_MAP: Record<number, number> = {
  0: 0,
  4.0: 180, // A2
  5.0: 300, // B1
  5.5: 360,
  6.0: 460, // B2
  6.5: 560,
  7.0: 680, // C1
  7.5: 810,
  8.0: 950, // C2
  8.5: 1100,
  9.0: 1250,
};

export const calculateCefrFeasibility = (
  currentBand: number,
  targetBand: number,
  durationDays: number,
): CefrHoursAnalysis => {
  const currentHours = BAND_HOURS_MAP[currentBand] ?? currentBand * 100;
  const targetHours = BAND_HOURS_MAP[targetBand] ?? targetBand * 110;

  const totalRequiredHours = Math.max(50, targetHours - currentHours);
  const dailyRequiredHours = parseFloat(
    (totalRequiredHours / Math.max(1, durationDays)).toFixed(1),
  );

  // Recommend days based on realistic 3 hours/day max healthy pace
  const recommendedDays = Math.ceil(totalRequiredHours / 3.0);

  let feasibilityStatus: 'realistic' | 'intensive' | 'unrealistic' = 'realistic';
  let statusText = '🟢 Real va Bajarish Mumkin';
  let description =
    "Ushbu reja Cambridge standartlariga to'liq mos va kunlik dars yuki sog'lom darajada.";

  if (dailyRequiredHours > 7.0) {
    feasibilityStatus = 'unrealistic';
    statusText = '🔴 Noreal / Haddan Tashqari Bosim';
    description = `Kuniga ${dailyRequiredHours} soat dars qilish miyaga juda og'ir va charchashga (burnout) olib keladi. Tavsiya etilgan muddat: ${recommendedDays} kun (kuniga 3.0 soatdan).`;
  } else if (dailyRequiredHours > 4.0) {
    feasibilityStatus = 'intensive';
    statusText = '🟡 Intensiv (Jiddiy Intizom Talab Qilinadi)';
    description = `Kuniga ${dailyRequiredHours} soat shug'ullanish kerak. Yuqori intizom va intellektual chidamlik talab etiladi.`;
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
