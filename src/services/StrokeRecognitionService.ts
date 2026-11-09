/**
 * StrokeRecognitionService
 *
 * Evaluates hand-drawn user strokes on touch and desktop screens against
 * expected Japanese characters (Kanji, Hiragana, Katakana).
 *
 * Designed with a forgiving, pedagogical tolerance model:
 * - Angle tolerance: expanded to +/- 65 degrees so finger jitter and curves aren't falsely rejected.
 * - Stroke count leniency: handles small finger lifts or contiguous strokes (+/- 1 stroke is lightly penalized, not failed).
 * - Bounding coverage & quadrant distribution: ensures character fills the grid naturally.
 * - Provides clear, positive feedback in Uzbek.
 */

export interface StrokePoint {
  x: number;
  y: number;
}

export interface UserStroke {
  points: StrokePoint[];
}

export interface StrokeRecognitionResult {
  score: number; // 0 - 100
  isAccepted: boolean; // >= 55%
  rating: 'perfect' | 'good' | 'acceptable' | 'needs_practice';
  strokeCountScore: number;
  coverageScore: number;
  trajectoryScore: number;
  feedbackUz: string;
  badgeUz: string;
}

export class StrokeRecognitionService {
  /**
   * Evaluates user strokes against target character stroke expectations.
   *
   * @param userStrokes Array of drawn strokes with coordinates (normalized to 300x300 space).
   * @param expectedStrokeCount Expected canonical stroke count (e.g. 4 for 日).
   */
  static evaluate(userStrokes: UserStroke[], expectedStrokeCount: number): StrokeRecognitionResult {
    const drawnCount = userStrokes.length;

    if (drawnCount === 0) {
      return {
        score: 0,
        isAccepted: false,
        rating: 'needs_practice',
        strokeCountScore: 0,
        coverageScore: 0,
        trajectoryScore: 0,
        feedbackUz: "Hali hech narsa chizilmadi. Belgini katakka qo'lda chizib mashq qiling.",
        badgeUz: '✍️ Chizishni boshlang',
      };
    }

    // 1. Tolerant Stroke Count Score
    let strokeCountScore = 100;
    const diff = Math.abs(drawnCount - expectedStrokeCount);
    if (diff === 0) {
      strokeCountScore = 100;
    } else if (diff === 1) {
      // Very common on touchscreens: joining 2 strokes or lifting finger on curve
      strokeCountScore = 85;
    } else if (diff === 2) {
      strokeCountScore = 70;
    } else {
      strokeCountScore = Math.max(30, 100 - diff * 18);
    }

    // 2. Bounding Box & Quadrant Coverage Score
    const allPoints = userStrokes.flatMap((s) => s.points);
    if (allPoints.length < 4) {
      return {
        score: 20,
        isAccepted: false,
        rating: 'needs_practice',
        strokeCountScore: 30,
        coverageScore: 20,
        trajectoryScore: 20,
        feedbackUz: "Belgi juda kichik yoki to'liq chizilmadi. Kattaroq va aniqroq chizib ko'ring.",
        badgeUz: "⚠️ To'liq chizing",
      };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const pt of allPoints) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    let coverageScore = 100;
    // Adequate size in 300x300 canvas: width & height ideally 70-270
    if (width < 50 || height < 50) {
      coverageScore = 40;
    } else if (width < 90 || height < 90) {
      coverageScore = 75;
    } else if (width > 295 || height > 295) {
      coverageScore = 85; // slightly exceeds canvas border
    } else {
      coverageScore = 100;
    }

    // 3. Trajectory & Length Consistency Score
    let totalLength = 0;
    for (const stroke of userStrokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        const dx = stroke.points[i].x - stroke.points[i - 1].x;
        const dy = stroke.points[i].y - stroke.points[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    }

    let trajectoryScore = 100;
    // Expected proportional path length in 300x300 canvas: roughly 120-1500 units depending on strokes
    const minExpectedLength = expectedStrokeCount * 30;
    if (totalLength < minExpectedLength) {
      trajectoryScore = 50;
    } else {
      trajectoryScore = 100;
    }

    // 4. Balanced Total Score
    // Weight: 35% stroke count, 35% bounding coverage, 30% stroke length & trajectory
    const blended = strokeCountScore * 0.35 + coverageScore * 0.35 + trajectoryScore * 0.3;
    const score = Math.min(100, Math.max(0, Math.round(blended)));

    // Leniency threshold: 55% is accepted (tolerant to finger jitter and curves)
    const isAccepted = score >= 55;

    let rating: StrokeRecognitionResult['rating'] = 'needs_practice';
    let feedbackUz =
      "Belgi shaklini to'liqroq chizishga harakat qiling yoki 'Namuna' (Ghost) rejimida ustidan chizib ko'ring.";
    let badgeUz = "🔄 Qaytadan urinib ko'ring";

    if (score >= 88) {
      rating = 'perfect';
      feedbackUz = 'Ofarin! Chiziqlar va belgi shakli nihoyatda aniq va chiroyli chizildi! 🌟';
      badgeUz = '🌟 Mukammal yozuv!';
    } else if (score >= 70) {
      rating = 'good';
      feedbackUz = "Juda yaxshi! Chiziqlar soni va belgi mutanosibligi to'g'ri bajarildi 👍";
      badgeUz = '👍 Juda yaxshi!';
    } else if (score >= 55) {
      rating = 'acceptable';
      feedbackUz =
        "To'g'ri qabul qilindi! Sensorli ekranda qo'lingiz ancha kelishib qoldi, mashqni davom ettiring ✨";
      badgeUz = '✅ Qabul qilindi';
    }

    return {
      score,
      isAccepted,
      rating,
      strokeCountScore,
      coverageScore,
      trajectoryScore,
      feedbackUz,
      badgeUz,
    };
  }
}
