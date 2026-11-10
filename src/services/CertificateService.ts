export interface JlptCertificateData {
  certificateId: string;
  studentName: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  score: number;
  maxScore: number;
  issuedDate: string;
  qrVerificationUrl: string;
  passStatus: boolean;
  scoreBreakdown: {
    languageKnowledge: number; // Max 60
    reading: number; // Max 60
    listening: number; // Max 60
  };
}

export class CertificateService {
  /**
   * Generates a unique verifiable certificate ID: e.g. KL-2026-N2-98421
   */
  static generateCertificateId(level: string): string {
    const year = new Date().getFullYear();
    const randomHex = Math.floor(10000 + Math.random() * 90000);
    return `KL-${year}-${level.toUpperCase()}-${randomHex}`;
  }

  /**
   * Evaluates whether exam score meets JLPT official passing criteria:
   * Total score >= passingScore AND each section score >= 19 / 60.
   */
  static evaluatePassStatus(
    level: string,
    breakdown: { languageKnowledge: number; reading: number; listening: number },
  ): { passed: boolean; totalScore: number; requiredScore: number } {
    const total = breakdown.languageKnowledge + breakdown.reading + breakdown.listening;
    const passingThresholds: Record<string, number> = {
      N1: 100,
      N2: 90,
      N3: 95,
      N4: 90,
      N5: 80,
    };
    const required = passingThresholds[level] || 90;
    const sectionMin = 19;
    const passed =
      total >= required &&
      breakdown.languageKnowledge >= sectionMin &&
      breakdown.reading >= sectionMin &&
      breakdown.listening >= sectionMin;

    return { passed, totalScore: total, requiredScore: required };
  }

  /**
   * Builds the official verification URL for the certificate
   */
  static buildVerificationUrl(certificateId: string): string {
    return `https://kaiwa.live/verify/${certificateId}`;
  }

  /**
   * Generates complete certificate payload for UI rendering and PDF download
   */
  static createCertificate(
    studentName: string,
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
    breakdown: { languageKnowledge: number; reading: number; listening: number },
  ): JlptCertificateData {
    const certId = this.generateCertificateId(level);
    const evalResult = this.evaluatePassStatus(level, breakdown);

    return {
      certificateId: certId,
      studentName: studentName.trim() || 'Hurmatli Talaba',
      level,
      score: evalResult.totalScore,
      maxScore: 180,
      issuedDate: new Date().toISOString().split('T')[0],
      qrVerificationUrl: this.buildVerificationUrl(certId),
      passStatus: evalResult.passed,
      scoreBreakdown: breakdown,
    };
  }
}
